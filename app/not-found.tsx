"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-grid px-4 text-center">
      <h1 className="text-9xl font-bold gradient-text">404</h1>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Page not found</h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-10 gradient-primary text-white border-0 shadow-md hover:opacity-90 hover:shadow-lg transition-all")}>
        Back to Home
      </Link>
    </div>
  );
}
