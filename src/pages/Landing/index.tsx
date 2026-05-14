import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { HowItWorks } from "@/components/HowItWorks";
import { SpotsMarquee } from "@/components/SpotsMarquee";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { Footer } from "@/components/Footer";
import { Backdrop } from "@/components/Backdrop";

/**
 * Landing page — the original App.tsx content, moved here unchanged.
 * Route: /
 */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <HowItWorks />
        <SpotsMarquee />
        <LiveLeaderboard />
      </main>
      <Footer />
    </div>
  );
}
