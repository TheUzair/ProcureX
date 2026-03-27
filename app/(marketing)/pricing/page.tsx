"use client";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for small teams getting started with procurement.",
    features: [
      "Up to 50 POs per month",
      "3 team members",
      "Basic reporting",
      "Email support",
      "Vendor management",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing teams that need more power and automation.",
    features: [
      "Unlimited POs",
      "15 team members",
      "Advanced analytics & dashboards",
      "AI-powered descriptions",
      "Real-time notifications",
      "PDF export",
      "Priority support",
      "Audit trail",
    ],
    cta: "Start Free Trial",
    variant: "default" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large organizations with complex procurement needs.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Custom workflows",
      "SSO & SAML",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, ever.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${plan.highlighted
                ? "border-primary shadow-lg shadow-primary/10 scale-105"
                : ""
                }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-white border-0">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ variant: plan.variant as "default" | "outline" }),
                    "w-full",
                    plan.highlighted && "gradient-primary text-white border-0 hover:opacity-90"
                  )}
                >
                  {plan.cta}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
