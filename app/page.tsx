import type React from "react"
import { HeroSection } from "@/components/home/hero-section"
import { Header } from "@/components/shared/header"
import { Features } from "@/components/home/feature-section"
import { ExamplesSection } from "@/components/home/exmple-section"
import StatsSection from "@/components/home/stats-section"
import { Pricing } from "@/components/home/pricing-section"
import { CTASection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export default function HomePage() {


  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      {/* Header */}
      <Header/>

      {/* Hero Section */}
      <HeroSection/>

      {/* Features Section */}
      <Features/>

      {/* Examples Section */}
      <ExamplesSection/>

      {/* Stats Section */}
      <StatsSection/>

      {/* Pricing Section */}
     <Pricing/>

      {/* CTA Section */}
      <CTASection/>

      {/* Footer */}
     <Footer/>
    </div>
  )
}
