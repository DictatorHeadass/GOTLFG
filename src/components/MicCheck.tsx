"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State = "idle" | "starting" | "listening" | "denied" | "unavailable" | "error";

const SEGMENTS = 16;

/** Peak level that counts as "this mic is actually picking you up". */
const SPEAKING_THRESHOLD = 0.16;

function toneFor(index: number): string {
  if (index >= SEGMENTS - 3) return "signal";
  if (index >= SEGMENTS - 6) return "amber";
  return "teal";
}

/**
 * A mic test, not a mic badge.
 *
 * Nothing here is stored or shown to anyone else. Passing this proves the
 * browser can hear you on this device right now - it cannot prove you will have
 * a working mic in the headset later, so recording a "verified" flag would be
 * the same trap as a self-reported age that looks vetted.
 *
 * The meter is driven imperatively. React state changes once when the threshold
 * is first crossed; the per-frame work is a handful of dataset writes on only
 * the segments that actually changed, which keeps a Quest 2 from dropping
 * frames while the loop runs.
 */
export function MicCheck() {
  const [state, setState] = useState<State>("idle");
  const [heard, setHeard] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const meterRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const litRef = useRef(0);

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

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;

    // Release the device, or the browser keeps showing the recording indicator.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    contextRef.current?.close().catch(() => {});
    contextRef.current = null;

    paint(0);
    setState("idle");
  }, [paint]);

  // Tear down on unmount as well as on Stop.
  useEffect(() => stop, [stop]);

  async function start() {
    setMessage(null);
    setHeard(false);

    if (typeof window === "undefined" || !window.isSecureContext) {
      setState("unavailable");
      setMessage("Microphone access needs a secure page - https, or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      setMessage("This browser can't open a microphone.");
      return;
    }

    setState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const context = new AudioContext();
      contextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);

      const samples = new Float32Array(analyser.fftSize);
      let peak = 0;
      setState("listening");

      const tick = () => {
        analyser.getFloatTimeDomainData(samples);

        let sum = 0;
        for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
        const rms = Math.sqrt(sum / samples.length);

        // RMS of speech sits well under 1; scale it into something a meter shows.
        const level = Math.min(1, rms * 7);
        paint(Math.round(level * SEGMENTS));

        // The only state change in the whole loop, and it happens at most once.
        if (level > peak) {
          peak = level;
          if (peak >= SPEAKING_THRESHOLD) setHeard(true);
        }

        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      const failure = error as DOMException;
      if (failure?.name === "NotAllowedError" || failure?.name === "SecurityError") {
        setState("denied");
        setMessage("Permission denied. Allow microphone access for this site, then try again.");
      } else if (failure?.name === "NotFoundError" || failure?.name === "OverconstrainedError") {
        setState("error");
        setMessage("No microphone found. Plug one in or switch input device.");
      } else {
        setState("error");
        setMessage(failure?.message || "Couldn't open the microphone.");
      }
    }
  }

  const listening = state === "listening";

  return (
    <div className="border border-line bg-panel/40">
      <div className="border-b border-line px-5 py-4">
        <h2 className="display text-[16px] text-bone">Mic check</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-bone-dim">
          Talk for a second and watch the meter. Nothing is recorded, sent, or saved.
        </p>
      </div>

      <div className="px-5 py-5">
        {/* Same segment language as the squad slots. */}
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

        <div className="mt-4 min-h-[20px]">
          {listening && heard && (
            <p className="text-[13px] text-teal" role="status">
              Your mic is working - the site can hear you.
            </p>
          )}
          {listening && !heard && (
            <p className="text-[13px] text-bone-dim" role="status">
              Listening. Say something.
            </p>
          )}
          {message && (
            <p
              className="text-[13px] text-bone"
              role={state === "denied" || state === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {listening ? (
            <button
              type="button"
              onClick={stop}
              className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={state === "starting"}
              className="tag border border-signal/70 bg-signal/10 px-4 py-2.5 text-signal transition-colors hover:bg-signal hover:text-void disabled:opacity-40"
            >
              {state === "starting" ? "Waiting for permission" : "Test my mic"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
