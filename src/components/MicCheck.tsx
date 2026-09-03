"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MIC_PHRASES, PHRASE_MATCH_RATIO } from "@/lib/game-data";

const SEGMENTS = 16;

/** Level above which a frame counts as voiced, in the meter's 0-1 scale. */
const VOICE_LEVEL = 0.14;
/** Voiced time needed before something counts as an utterance rather than a bump. */
const MIN_VOICED_MS = 420;
/** Trailing silence that marks the end of an utterance. */
const END_SILENCE_MS = 420;
/** How long to wait on one phrase before offering a nudge. */
const PHRASE_TIMEOUT_MS = 15_000;

type Phase = "idle" | "starting" | "listening" | "saving" | "done";

function toneFor(index: number): string {
  if (index >= SEGMENTS - 3) return "signal";
  if (index >= SEGMENTS - 6) return "amber";
  return "teal";
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Fraction of the phrase's words that appear in what the recogniser heard. */
function matchRatio(phrase: string, heard: string): number {
  const target = words(phrase);
  if (target.length === 0) return 0;
  const said = new Set(words(heard));
  return target.filter((w) => said.has(w)).length / target.length;
}

// The Web Speech API is not in the standard DOM lib, and is absent entirely in
// several browsers we care about (Quest Browser among them).
type SpeechEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Mic check: say three phrases, get a badge for this session.
 *
 * Two detection paths. Word matching uses the Web Speech API, which in Chrome
 * sends audio to Google - so it is strictly opt-in, never pre-ticked, and
 * disclosed in the privacy policy. Everything else, including Quest Browser
 * which has no SpeechRecognition at all, uses local utterance detection: the
 * audio never leaves the device and we verify that you spoke on cue for a
 * plausible duration, not which words you said.
 *
 * The badge is honest about that difference, and about the fact that the
 * browser is the one reporting the result.
 */
export function MicCheck({
  initialVerified = false,
  initialMethod = null,
}: {
  initialVerified?: boolean;
  initialMethod?: string | null;
}) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  const [useSpeech, setUseSpeech] = useState(false);
  const [verified, setVerified] = useState(initialVerified);
  const [method, setMethod] = useState<string | null>(initialMethod);
  const [speechSupported, setSpeechSupported] = useState(false);

  const meterRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const litRef = useRef(0);
  const activeRef = useRef(false);
  const indexRef = useRef(0);

  useEffect(() => setSpeechSupported(recognitionCtor() !== null), []);

  const paint = useCallback((lit: number) => {
    if (lit === litRef.current) return;
    const segments = meterRef.current?.children;
    if (!segments) return;
    const from = Math.min(lit, litRef.current);
    const to = Math.max(lit, litRef.current);
    for (let i = from; i < to && i < segments.length; i += 1) {
      const element = segments[i] as HTMLElement;
      if (i < lit) element.dataset.on = toneFor(i);
      else delete element.dataset.on;
    }
    litRef.current = lit;
  }, []);

  const teardown = useCallback(() => {
    activeRef.current = false;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;

    recognitionRef.current?.abort();
    recognitionRef.current = null;

    // Release the device, or the browser keeps showing the recording indicator.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    contextRef.current?.close().catch(() => {});
    contextRef.current = null;

    paint(0);
  }, [paint]);

  useEffect(() => teardown, [teardown]);

  const finish = useCallback(
    async (how: "speech" | "utterance") => {
      teardown();
      setPhase("saving");

      const response = await fetch("/api/mic-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: how, phrasesPassed: MIC_PHRASES.length }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setMessage(body?.error ?? "Couldn't save the result");
        setPhase("idle");
        return;
      }

      setVerified(true);
      setMethod(how);
      setPhase("done");
      router.refresh();
    },
    [router, teardown],
  );

  const advance = useCallback(
    (how: "speech" | "utterance") => {
      const next = indexRef.current + 1;
      setNudge(false);
      if (next >= MIC_PHRASES.length) {
        void finish(how);
        return;
      }
      indexRef.current = next;
      setIndex(next);
    },
    [finish],
  );

  async function start() {
    setMessage(null);
    setNudge(false);
    indexRef.current = 0;
    setIndex(0);

    if (typeof window === "undefined" || !window.isSecureContext) {
      setMessage("Microphone access needs a secure page - https, or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser can't open a microphone.");
      return;
    }

    setPhase("starting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (error) {
      const failure = error as DOMException;
      if (failure?.name === "NotAllowedError" || failure?.name === "SecurityError") {
        setMessage("Permission denied. Allow microphone access for this site, then try again.");
      } else if (failure?.name === "NotFoundError" || failure?.name === "OverconstrainedError") {
        setMessage("No microphone found. Plug one in or switch input device.");
      } else {
        setMessage(failure?.message || "Couldn't open the microphone.");
      }
      setPhase("idle");
      return;
    }

    streamRef.current = stream;
    activeRef.current = true;

    const context = new AudioContext();
    contextRef.current = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);

    const samples = new Float32Array(analyser.fftSize);
    setPhase("listening");

    const speechMode = useSpeech && recognitionCtor() !== null;
    if (speechMode) startRecognition();

    let voicedMs = 0;
    let silenceMs = 0;
    let phraseStart = performance.now();
    let last = phraseStart;
    let watched = indexRef.current;

    const tick = () => {
      if (!activeRef.current) return;

      const now = performance.now();
      const delta = now - last;
      last = now;

      // Reset the detector whenever we move to a new phrase.
      if (watched !== indexRef.current) {
        watched = indexRef.current;
        voicedMs = 0;
        silenceMs = 0;
        phraseStart = now;
      }

      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
      const level = Math.min(1, Math.sqrt(sum / samples.length) * 7);
      paint(Math.round(level * SEGMENTS));

      if (level > VOICE_LEVEL) {
        voicedMs += delta;
        silenceMs = 0;
      } else if (voicedMs > 0) {
        silenceMs += delta;
      }

      // Word matching decides the outcome when it is on; otherwise a
      // long-enough utterance followed by silence counts.
      if (!speechMode && voicedMs >= MIN_VOICED_MS && silenceMs >= END_SILENCE_MS) {
        voicedMs = 0;
        silenceMs = 0;
        phraseStart = now;
        advance("utterance");
      } else if (now - phraseStart > PHRASE_TIMEOUT_MS) {
        phraseStart = now;
        setNudge(true);
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    function startRecognition() {
      const Ctor = recognitionCtor();
      if (!Ctor) return;

      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        const target = MIC_PHRASES[indexRef.current];
        let best = 0;
        for (let i = 0; i < event.results.length; i += 1) {
          const alternatives = event.results[i];
          for (let j = 0; j < alternatives.length; j += 1) {
            best = Math.max(best, matchRatio(target, alternatives[j].transcript));
          }
        }
        if (best >= PHRASE_MATCH_RATIO) advance("speech");
        else setNudge(true);
      };

      recognition.onerror = (event) => {
        // "no-speech" and "aborted" are routine; anything else means the
        // recogniser is unusable, so drop to local detection rather than stall.
        if (event?.error && !["no-speech", "aborted"].includes(event.error)) {
          setMessage("Word matching stopped working - switched to local detection.");
          setUseSpeech(false);
          recognitionRef.current = null;
        }
      };

      recognition.onend = () => {
        if (activeRef.current && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // Already restarting; the next onend will retry.
          }
        }
      };

      try {
        recognition.start();
      } catch {
        setMessage("Couldn't start word matching - using local detection.");
        setUseSpeech(false);
      }
    }
  }

  function cancel() {
    teardown();
    setPhase("idle");
    setNudge(false);
  }

  const listening = phase === "listening";

  return (
    <div className="border border-line bg-panel/40">
      <div className="border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="display text-[16px] text-bone">Mic check</h2>
          {verified && <MicBadge method={method} />}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-bone-dim">
          {verified
            ? "You're set for this session. Signing in again asks for a fresh check."
            : `Say ${MIC_PHRASES.length} short phrases so your squad knows your mic works.`}
        </p>
      </div>

      <div className="px-5 py-5">
        {listening && (
          <div className="mb-5">
            <p className="tag-sm text-bone-faint">
              Phrase {index + 1} of {MIC_PHRASES.length}
            </p>
            <p className="display mt-2 text-[22px] leading-tight text-bone">
              &ldquo;{MIC_PHRASES[index]}&rdquo;
            </p>
          </div>
        )}

        <div
          ref={meterRef}
          className="flex items-end gap-[3px]"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={SEGMENTS}
          aria-valuenow={listening ? litRef.current : 0}
          aria-label="Microphone input level"
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} className="meter-segment h-6 w-[7px]" />
          ))}
        </div>

        <div className="mt-4 min-h-[20px] space-y-1">
          {listening && !nudge && (
            <p className="text-[13px] text-bone-dim" role="status">
              Listening. Read the line out loud.
            </p>
          )}
          {listening && nudge && (
            <p className="text-[13px] text-amber" role="status">
              Didn&apos;t catch that. Try again, a bit louder.
            </p>
          )}
          {phase === "saving" && <p className="text-[13px] text-bone-dim">Saving.</p>}
          {phase === "done" && (
            <p className="text-[13px] text-teal" role="status">
              Mic verified for this session.
            </p>
          )}
          {message && (
            <p className="text-[13px] text-bone" role="alert">
              {message}
            </p>
          )}
        </div>

        {/* Consent, never pre-ticked: this ships audio to a third party. */}
        {!listening && speechSupported && (
          <label className="mt-4 flex w-fit max-w-[62ch] cursor-pointer items-start gap-2.5 border border-line-bright px-3 py-2.5 text-[13px] text-bone-dim transition-colors hover:border-bone-dim">
            <input
              type="checkbox"
              checked={useSpeech}
              onChange={(e) => setUseSpeech(e.target.checked)}
              className="mt-0.5 accent-signal"
            />
            <span>
              Check the actual words I say.
              <span className="mt-1 block text-[12.5px] leading-relaxed text-bone-faint">
                Uses your browser&apos;s speech recognition, which in Chrome and Edge sends
                the audio to Google to be transcribed. Leave this off and the check runs
                entirely on your device instead.
              </span>
            </span>
          </label>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {listening ? (
            <button
              type="button"
              onClick={cancel}
              className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={phase === "starting" || phase === "saving"}
              className="tag border border-signal/70 bg-signal/10 px-4 py-2.5 text-signal transition-colors hover:bg-signal hover:text-void disabled:opacity-40"
            >
              {phase === "starting"
                ? "Waiting for permission"
                : verified
                  ? "Run it again"
                  : "Start mic check"}
            </button>
          )}
        </div>

        <p className="mt-4 max-w-[64ch] text-[12.5px] leading-relaxed text-bone-faint">
          No audio is recorded or stored by this site, and nothing is sent to our servers -
          only the pass or fail result is saved, for this session.
        </p>
      </div>
    </div>
  );
}

export function MicBadge({ method }: { method?: string | null }) {
  return (
    <span
      className="tag-sm inline-flex items-center gap-1.5 border border-teal/60 px-1.5 py-[3px] leading-none text-teal"
      title={
        method === "speech"
          ? "Read three phrases aloud this session and the words were recognised. Reported by their browser, not proof of a working mic in-game."
          : "Spoke on cue three times this session, checked on their own device. Reported by their browser, not proof of a working mic in-game."
      }
    >
      <svg viewBox="0 0 10 10" aria-hidden="true" className="h-2.5 w-2.5 fill-current">
        <path d="M3.8 7.6 1.2 5l.9-.9 1.7 1.7L7.9 1.7l.9.9z" />
      </svg>
      Mic verified
    </span>
  );
}
