"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useConvexAuth } from "convex/react"
import AnimatedContainer from "../animate-container"


export function CTASection() {
    const {isAuthenticated } = useConvexAuth()
    
  return (
      <section className={cn("overflow-hidden  pt-0 md:pt-0")}>
          <AnimatedContainer delay={0.5}>
              
      <div className="relative mx-auto flex max-w-container flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24 bg-card">
        {/* Badge */}
   
          <Badge
            variant="outline"
            className="animate-fade-in-up delay-100"
          >
            <span className="text-muted-foreground">Get Started</span>
          </Badge>
       

        {/* Title */}
        <h2 className="text-3xl font-semibold sm:text-5xl animate-fade-in-up delay-200">
          Ready to transform your forms?
        </h2>

        {/* Description */}
        
          <p className="text-muted-foreground animate-fade-in-up delay-300">
            Join thousands of businesses creating better forms with AI
          </p>
    
        {/* Action Button */}
        <Button
          size="lg"
          className="animate-fade-in-up delay-500"
          asChild
        >
          <Link href={isAuthenticated ? "/dashboard" : "/auth/signin"}>Get Started Free</Link>
        </Button>

        {/* Glow Effect */}
     
          <div className="fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-glow animate-scale-in delay-700" />
       
      </div>
          </AnimatedContainer>
    </section>
  )
}
