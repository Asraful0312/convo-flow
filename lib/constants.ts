export interface PricingPlan {
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

export const PLANS: PricingPlan[] = [
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
