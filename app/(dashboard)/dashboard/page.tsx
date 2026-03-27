"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DocumentTextIcon,
  UserGroupIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import type { PurchaseOrderListItem, PaginatedResponse } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-500",
  approved: "bg-green-500/10 text-green-500",
  completed: "bg-blue-500/10 text-blue-500",
  cancelled: "bg-red-500/10 text-red-500",
  pending_stock: "bg-yellow-500/10 text-yellow-500",
};

export default function DashboardPage() {
  const [pos, setPOs] = useState<PurchaseOrderListItem[]>([]);
  const [stats, setStats] = useState({ total: 0, vendors: 0, products: 0, value: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [poRes, vendorRes, productRes] = await Promise.all([
          apiClient.getPurchaseOrders({ page: 1, page_size: 5 }) as Promise<PaginatedResponse<PurchaseOrderListItem>>,
          apiClient.getVendors({ page: 1, page_size: 1 }) as Promise<PaginatedResponse<unknown>>,
          apiClient.getProducts({ page: 1, page_size: 1 }) as Promise<PaginatedResponse<unknown>>,
        ]);
        setPOs(poRes.items);

        const totalValue = poRes.items.reduce((sum, po) => sum + Number(po.total), 0);
        setStats({
          total: poRes.total,
          vendors: vendorRes.total,
          products: productRes.total,
          value: totalValue,
        });
      } catch {
        // API not available yet — show empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const summaryCards = [
    { title: "Total POs", value: stats.total, icon: DocumentTextIcon, color: "text-purple-500" },
    { title: "Active Vendors", value: stats.vendors, icon: UserGroupIcon, color: "text-blue-500" },
    { title: "Products", value: stats.products, icon: CubeIcon, color: "text-green-500" },
    { title: "Total Value", value: `$${stats.value.toLocaleString()}`, icon: CurrencyDollarIcon, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your procurement activity</p>
        </div>
        <Link href="/purchase-orders/new" className={cn(buttonVariants(), "gradient-primary text-white border-0 hover:opacity-90")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New PO
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent POs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Purchase Orders</CardTitle>
          <Link href="/purchase-orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pos.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <DocumentTextIcon className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No purchase orders yet</p>
              <Link href="/purchase-orders/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                Create your first PO
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pos.map((po) => (
                <Link
                  key={po.id}
                  href={`/purchase-orders/${po.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{po.reference_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {po.vendor_name || "Unknown Vendor"} &middot; {po.items_count} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={statusColors[po.status]}>
                      {po.status.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-medium">
                      ${po.total.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
