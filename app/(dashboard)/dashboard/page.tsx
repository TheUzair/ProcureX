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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Overview of your procurement activity</p>
        </div>
        <Link href="/purchase-orders/new" className={cn(buttonVariants({ size: "lg" }), "gradient-primary text-white border-0 shadow-md hover:opacity-90 hover:shadow-lg transition-all")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New PO
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", card.color.replace("text-", "bg-").replace("500", "500/10"))}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent POs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Purchase Orders</CardTitle>
          <Link href="/purchase-orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : pos.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <DocumentTextIcon className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-medium">No purchase orders yet</p>
              <p className="mt-1 text-sm">Create your first purchase order to get started</p>
              <Link href="/purchase-orders/new" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
                Create your first PO
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pos.map((po) => (
                <Link
                  key={po.id}
                  href={`/purchase-orders/${po.id}`}
                  className="flex items-center justify-between rounded-xl border p-4 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{po.reference_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {po.vendor_name || "Unknown Vendor"} &middot; {po.items_count} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className={statusColors[po.status]}>
                      {po.status.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums">
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
