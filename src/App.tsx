import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { HowItWorks } from "./components/HowItWorks";
import { SpotsMarquee } from "./components/SpotsMarquee";
import { RollLookup } from "./components/RollLookup";
import { Footer } from "./components/Footer";
import { Backdrop } from "./components/Backdrop";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Backdrop />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <HowItWorks />
        <SpotsMarquee />
        <RollLookup />
      </main>
      <Footer />
    </div>
  );
}
