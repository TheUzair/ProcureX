"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import type { PurchaseOrder, POStatus } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-500",
  approved: "bg-green-500/10 text-green-500",
  completed: "bg-blue-500/10 text-blue-500",
  cancelled: "bg-red-500/10 text-red-500",
  pending_stock: "bg-yellow-500/10 text-yellow-500",
};

const transitions: Record<string, { label: string; to: POStatus; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]> = {
  draft: [
    { label: "Approve", to: "approved", icon: CheckCircleIcon, variant: "default" },
    { label: "Cancel", to: "cancelled", icon: XCircleIcon, variant: "destructive" },
  ],
  approved: [
    { label: "Complete", to: "completed", icon: TruckIcon, variant: "default" },
    { label: "Cancel", to: "cancelled", icon: XCircleIcon, variant: "destructive" },
  ],
  pending_stock: [
    { label: "Approve", to: "approved", icon: CheckCircleIcon, variant: "default" },
    { label: "Cancel", to: "cancelled", icon: XCircleIcon, variant: "destructive" },
  ],
};

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPO = useCallback(async () => {
    try {
      const data = (await apiClient.getPurchaseOrder(id)) as PurchaseOrder;
      setPO(data);
    } catch {
      toast.error("Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPO();
  }, [loadPO]);

  const handleStatusChange = async (status: POStatus) => {
    try {
      await apiClient.updatePOStatus(id, status);
      toast.success(`Status updated to ${status}`);
      loadPO();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await apiClient.downloadPOPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${po?.reference_number || "PO"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Purchase order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const availableTransitions = transitions[po.status] || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{po.reference_number}</h1>
          <p className="text-muted-foreground">
            Created {new Date(po.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="secondary" className={`text-sm ${statusColors[po.status]}`}>
          {po.status.replace("_", " ")}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
          <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
          PDF
        </Button>
      </div>

      {/* Status actions */}
      {availableTransitions.length > 0 && (
        <Card>
          <CardContent className="flex gap-3 pt-6">
            {availableTransitions.map((t) => (
              <Button
                key={t.to}
                variant={t.variant}
                onClick={() => handleStatusChange(t.to)}
                className={t.variant === "default" ? "gradient-primary text-white border-0 hover:opacity-90" : ""}
              >
                <t.icon className="mr-2 h-4 w-4" />
                {t.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vendor info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{po.vendor_name || "Unknown"}</p>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items ({po.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {po.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{item.product_name || "Product"}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {item.product_sku} &middot; Qty: {item.quantity} &times; ${Number(item.unit_price).toFixed(2)}
                  </p>
                </div>
                <span className="font-medium">${Number(item.line_total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${Number(po.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>${Number(po.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>${Number(po.shipping_cost).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-${Number(po.discount).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>${Number(po.total).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {po.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{po.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
