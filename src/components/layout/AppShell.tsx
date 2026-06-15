import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />
      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
