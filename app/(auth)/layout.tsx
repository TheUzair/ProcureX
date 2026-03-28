import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 bg-grid px-4">
      <Link href="/" className="mb-10 text-3xl font-bold gradient-text">
        ProcureX
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} ProcureX. All rights reserved.
      </p>
    </div>
  );
}
