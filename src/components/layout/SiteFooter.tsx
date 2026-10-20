import { cn } from "@/lib/utils";

// The Terms and Privacy Policy are shared by all of daniyalzia.co.uk, so they sit at the domain root, outside
// DeckForge's /deckforge basePath. That's why these are plain <a> tags: next/link would put /deckforge in front.
export const TERMS_URL = "/terms";
export const PRIVACY_URL = "/privacy";
export const REPORT_URL = "/terms#reporting";

// text-secondary, not text-muted: muted grey on the dark background is under the 4.5:1 contrast small text needs.
// Links are always underlined so they don't rely on colour alone.
const linkClass = "underline underline-offset-2 hover:text-primary transition-colors";

/** "Terms · Privacy Policy", for under the sign-in form. */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-secondary", className)}>
      <a href={TERMS_URL} className={linkClass}>Terms</a>
      <span aria-hidden="true">{" · "}</span>
      <a href={PRIVACY_URL} className={linkClass}>Privacy Policy</a>
    </p>
  );
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("text-xs text-secondary text-center space-y-2", className)}>
      <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <a href={TERMS_URL} className={linkClass}>Terms</a>
        <a href={PRIVACY_URL} className={linkClass}>Privacy Policy</a>
        <a href={REPORT_URL} className={linkClass}>Report a problem</a>
      </nav>
      <p>
        Card data and images from{" "}
        <a href="https://ygoprodeck.com" target="_blank" rel="noopener noreferrer" className={linkClass}>
          YGOPRODeck<span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
      <p className="max-w-2xl mx-auto leading-relaxed">
        Yu-Gi-Oh! is a trademark of Konami Digital Entertainment. Card names, text and artwork © Studio Dice/SHUEISHA,
        TV TOKYO, KONAMI. This is an unofficial fan project, not affiliated with or endorsed by Konami.
      </p>
    </footer>
  );
}
