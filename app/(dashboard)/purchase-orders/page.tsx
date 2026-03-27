"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import type { PurchaseOrderListItem, PaginatedResponse } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-500",
  approved: "bg-green-500/10 text-green-500",
  completed: "bg-blue-500/10 text-blue-500",
  cancelled: "bg-red-500/10 text-red-500",
  pending_stock: "bg-yellow-500/10 text-yellow-500",
};

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 10 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = (await apiClient.getPurchaseOrders(params as Parameters<typeof apiClient.getPurchaseOrders>[0])) as PaginatedResponse<PurchaseOrderListItem>;
      setPOs(res.items);
      setTotalPages(res.total_pages);
    } catch {
      setPOs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadPOs();
  }, [loadPOs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage your purchase orders</p>
        </div>
        <Link href="/purchase-orders/new" className={cn(buttonVariants(), "gradient-primary text-white border-0 hover:opacity-90")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New PO
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference or vendor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending_stock">Pending Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PO List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : pos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No purchase orders found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pos.map((po) => (
                <Link
                  key={po.id}
                  href={`/purchase-orders/${po.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{po.reference_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {po.vendor_name || "Unknown"} &middot; {po.items_count} items &middot;{" "}
                      {new Date(po.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={statusColors[po.status]}>
                      {po.status.replace("_", " ")}
                    </Badge>
                    <span className="font-medium">${po.total.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
