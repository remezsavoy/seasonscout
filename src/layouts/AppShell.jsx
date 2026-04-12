import { Outlet } from 'react-router-dom';
import { Footer } from '../components/navigation/Footer';
import { Header } from '../components/navigation/Header';
import { ScrollToTop } from '../components/utils/ScrollToTop';

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden dark:bg-[#030303] dark:text-slate-100">
      <ScrollToTop />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-hero-glow dark:opacity-15" />
      <div className="pointer-events-none absolute right-[-7rem] top-24 -z-10 h-72 w-72 rounded-full bg-lagoon/10 blur-3xl dark:bg-white/5" />
      <div className="pointer-events-none absolute left-[-5rem] top-[28rem] -z-10 h-60 w-60 rounded-full bg-sunrise/20 blur-3xl dark:bg-white/[0.03]" />

      <Header />

      <main className="pb-20 pt-8 sm:pt-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
