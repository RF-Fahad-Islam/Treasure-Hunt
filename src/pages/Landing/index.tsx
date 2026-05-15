import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Experience } from "@/components/Experience";
import { SpotsMarquee } from "@/components/SpotsMarquee";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BottomCTA } from "@/components/BottomCTA";
import { Footer } from "@/components/Footer";
import { Backdrop } from "@/components/Backdrop";
import { MiniGame } from "@/components/MiniGame";
import { TreasurePuzzle } from "@/components/TreasurePuzzle";

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
        <Experience />
        <HowItWorks />
        <TreasurePuzzle />
        <SpotsMarquee />
        <LiveLeaderboard />
        <CountdownTimer />
        <MiniGame />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
