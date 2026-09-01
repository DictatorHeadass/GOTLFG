import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Archivo for signage, Plex Sans for reading, Plex Mono for anything that is a
// code, a count or a clock. Plex has an engineering pedigree that suits a board.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GOT LFG - Ghosts of Tabor squad finder",
  description:
    "Find a Ghosts of Tabor squad by map, mode, skill and age gate. Post a squad, fill the slots, swap Discord.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Deliberately not capping maximum-scale: pinch-zoom is how people cope with
  // a headset panel or a small phone, and blocking it helps nobody.
  themeColor: "#101417",
};

/**
 * Decides comfort mode before first paint, so a headset never flashes the
 * desktop layout and then reflows. Kept tiny and dependency-free because it
 * runs ahead of everything else.
 */
const COMFORT_BOOTSTRAP = `
(function(){
  try {
    var stored = localStorage.getItem("got-lfg-comfort");
    var isHeadset = /OculusBrowser|Quest|Pico|Wolvic/i.test(navigator.userAgent);
    var on = stored === null ? isHeadset : stored === "on";
    if (on) document.documentElement.setAttribute("data-comfort", "on");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: COMFORT_BOOTSTRAP }} />
        {children}
      </body>
    </html>
  );
}
