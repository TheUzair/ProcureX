import type { Metadata } from "next";
import {
  LightBulbIcon,
  RocketLaunchIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = { title: "About" };

const values = [
  {
    icon: LightBulbIcon,
    title: "Innovation First",
    description:
      "We leverage AI and modern tech to automate tedious procurement tasks so your team can focus on what matters.",
  },
  {
    icon: RocketLaunchIcon,
    title: "Speed & Reliability",
    description:
      "Built on a fast, scalable architecture that handles thousands of purchase orders without breaking a sweat.",
  },
  {
    icon: UserGroupIcon,
    title: "Team Collaboration",
    description:
      "Real-time updates and audit trails keep everyone on the same page — from requesters to approvers.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About <span className="gradient-text">ProcureX</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            ProcureX was born from a simple idea: procurement shouldn&apos;t be
            painful. We&apos;re building the tools modern teams need to manage
            purchasing with confidence, speed, and full visibility.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-12 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Our Vision</h2>
            <p className="mt-4 text-muted-foreground leading-7">
              A world where every organization — from startups to enterprises —
              has access to intelligent, frictionless procurement tools. We
              envision procurement as a strategic advantage, not a bottleneck.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-7">
              To deliver a SaaS platform that simplifies every step of the
              purchase order lifecycle — from creation to approval, stock
              management to audit trails — powered by AI and built for
              collaboration.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mx-auto mt-20 max-w-5xl">
          <h2 className="text-center text-3xl font-bold">What Drives Us</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
