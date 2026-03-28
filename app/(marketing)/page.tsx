import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: ClipboardDocumentListIcon,
    title: "Purchase Order Management",
    description: "Create, track, and manage purchase orders with an intuitive workflow from draft to completion.",
  },
  {
    icon: CubeIcon,
    title: "Inventory Control",
    description: "Real-time stock tracking with automatic deduction on approval and smart restocking alerts.",
  },
  {
    icon: ChartBarIcon,
    title: "Analytics & Reports",
    description: "Comprehensive dashboards with spending analysis, vendor performance, and export capabilities.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Audit Trail",
    description: "Complete audit logging of every change — who did what, when, with full diff history.",
  },
  {
    icon: BoltIcon,
    title: "Real-Time Updates",
    description: "Instant notifications when PO statuses change. No more refreshing — see updates live.",
  },
  {
    icon: SparklesIcon,
    title: "AI-Powered Descriptions",
    description: "Generate professional product descriptions instantly using Gemini AI integration.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <SparklesIcon className="mr-2 h-4 w-4" />
              Now with AI-powered product descriptions
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Procurement,{" "}
              <span className="gradient-text">simplified</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
              ProcureX streamlines your entire purchase order workflow — from
              vendor management to approval chains, stock control to audit
              trails. Built for modern teams.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="gradient-primary text-white border-0 px-8 text-base hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-xl border bg-card/80 p-2 shadow-2xl shadow-primary/10 glass">
              <div className="rounded-lg bg-muted/50 p-8">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Total POs", value: "1,284", color: "text-primary" },
                    { label: "Approved", value: "856", color: "text-green-600 dark:text-green-400" },
                    { label: "Pending", value: "312", color: "text-yellow-600 dark:text-yellow-400" },
                    { label: "Completed", value: "116", color: "text-blue-600 dark:text-blue-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-card p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">PO-2026-{String(i).padStart(4, "0")}</span>
                        <span className="text-sm text-muted-foreground">Acme Corp</span>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        Approved
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/20 py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to{" "}
              <span className="gradient-text">manage procurement</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete toolkit for teams that want control, visibility, and
              speed in their purchasing process.
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-hover group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl gradient-primary p-12 text-center shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to streamline your procurement?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Join thousands of teams already using ProcureX to manage their
                purchase orders efficiently.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 px-8 text-base font-semibold"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8 text-base"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
