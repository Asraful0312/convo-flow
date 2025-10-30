"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";


interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}


export const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "0",
    yearlyPrice: "0",
    period: "month",
    description: "Perfect for trying out ConvoFlow",
    features: [
      "3 active forms",
      "100 responses/month",
      "Basic analytics",
      "Email notifications",
    ],
    buttonText: "Get Started",
    href: "/auth/signup",
    isPopular: false,
  },
  {
    name: "Pro",
    price: "19",
    yearlyPrice: "190", // optional 10x for yearly example
    period: "month",
    description: "For small businesses and solopreneurs",
    features: [
      "Unlimited forms",
      "1,000 responses/month",
      "Advanced analytics & AI insights",
      "Custom branding",
      "Voice input/output",
      "Priority support",
    ],
    buttonText: "Start Free Trial",
    href: "/auth/signup",
    isPopular: true,
  },
  {
    name: "Business",
    price: "49",
    yearlyPrice: "490",
    period: "month",
    description: "For growing teams",
    features: [
      "Everything in Pro",
      "10,000 responses/month",
      "Team collaboration",
      "Advanced integrations",
      "Custom domain",
      "White-label option",
    ],
    buttonText: "Get Started",
    href: "/auth/signup",
    isPopular: false,
  },
];


export function Pricing({
  title = "Our Pricing",
  description = "Start free, upgrade as you grow. No hidden fees.",
}) {

    const isDesktop = useMediaQuery("(min-width: 1024px)");


  return (
    <section id="pricing" className="container py-20">
        <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-3">{ title}</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          { description}
            </p>
                </div>



      <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              `rounded-2xl border p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative`,
              plan.isPopular ? "border-primary border-2" : "border-border",
              "flex flex-col",
              !plan.isPopular && "mt-5",
              index === 0 || index === 2
                ? "z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-10"
                : "z-10",
              index === 0 && "origin-right",
              index === 2 && "origin-left"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                <Star className="text-primary-foreground h-4 w-4 fill-current" />
                <span className="text-primary-foreground ml-1 font-sans font-semibold">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-muted-foreground">
                {plan.name}
              </p>
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  <NumberFlow
                    value={
                      Number(plan.price)
                    }
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                   
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                    className="font-variant-numeric: tabular-nums"
                  />
                </span>
                {plan.period !== "Next 3 months" && (
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                    / {plan.period}
                  </span>
                )}
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                 billed monthly
              </p>

              <ul className="mt-5 gap-2 flex flex-col">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <span className="text-left">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4" />

              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground"
                )}
              >
                {plan.buttonText}
              </Link>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

           <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Need more? Enterprise plans available</p>
            <Link href="/contact">
              <Button variant="secondary" className="text-[#6366f1]">
                Contact Sales →
              </Button>
            </Link>
          </div>
    </section>
  );
}
