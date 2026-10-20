import { Navbar } from "./Navbar";
import { SiteFooter } from "./SiteFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />
      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
        {children}
      </main>
      <SiteFooter className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 border-t border-border/50" />
    </div>
  );
}
