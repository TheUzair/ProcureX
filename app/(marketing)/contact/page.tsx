"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contactFormSchema, type ContactFormData } from "@/lib/validators";
import { EnvelopeIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = async (data: ContactFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    reset();
  };

  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have questions about ProcureX? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="space-y-8 lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  hello@procurex.com
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PhoneIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  +1 (555) 000-0000
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Office</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  123 Innovation Drive<br />
                  San Francisco, CA 94107
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-xl border bg-card p-8 shadow-sm lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="How can we help?"
                  {...register("subject")}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us more..."
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gradient-primary text-white border-0 hover:opacity-90"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
