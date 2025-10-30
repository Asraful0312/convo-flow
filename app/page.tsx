"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, BarChart3, Check, Zap, Users, FileText } from "lucide-react"
import { HeroSection } from "@/components/home/hero-section"
import { Header } from "@/components/shared/header"
import { Features } from "@/components/home/feature-section"
import { ExamplesSection } from "@/components/home/exmple-section"
import StatsSection from "@/components/home/stats-section"
import { Pricing } from "@/components/home/pricing-section"
import { CTASection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export default function HomePage() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

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
