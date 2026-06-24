import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { PartnersMarquee } from "@/components/landing/PartnersMarquee";
import { Stats } from "@/components/landing/Stats";
import { Benefits } from "@/components/landing/Benefits";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="page">
      <Header />
      <Hero />
      <PartnersMarquee />
      <Stats />
      <Benefits />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <FinalCTA />
      <Footer />
    </main>
  );
}
