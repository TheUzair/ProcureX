"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import type { PurchaseOrderListItem, PurchaseOrder, PaginatedResponse } from "@/types";

// ─── Status colors ───
const statusColors: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-500",
  approved: "bg-green-500/10 text-green-500",
  completed: "bg-blue-500/10 text-blue-500",
  cancelled: "bg-red-500/10 text-red-500",
  pending_stock: "bg-yellow-500/10 text-yellow-500",
};

const statusCardColors: Record<string, string> = {
  draft: "text-orange-600",
  approved: "text-green-600",
  completed: "text-blue-600",
  cancelled: "text-red-600",
  pending_stock: "text-yellow-600",
};

// ─── Dashboard Cards ───
function PODashboard({
  data,
  activeStatus,
  onCardClick,
}: {
  data: Record<string, number>;
  activeStatus: string;
  onCardClick: (status: string) => void;
}) {
  const cards = [
    { key: "draft", label: "Draft" },
    { key: "approved", label: "Approved" },
    { key: "pending_stock", label: "Pending Stock" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-5">
          {cards.map((card, i) => (
            <div
              key={card.key}
              className={cn(
                "cursor-pointer group py-5 pl-6 transition-all duration-200 hover:bg-muted/50",
                i < cards.length - 1 && "border-b md:border-b-0 md:border-r",
                activeStatus === card.key && "bg-primary/5 ring-inset ring-1 ring-primary/20"
              )}
              onClick={() => onCardClick(card.key)}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                {card.label}
              </h2>
              <p className={cn("mt-1 text-3xl font-bold tracking-tight", statusCardColors[card.key])}>
                {data[card.key] || 0}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Expandable Line Items ───
function POLineItems({ poId }: { poId: string }) {
  const [items, setItems] = useState<PurchaseOrder["items"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const po = (await apiClient.getPurchaseOrder(poId)) as PurchaseOrder;
        if (!cancelled) setItems(po.items);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poId]);

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/30 p-4">
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!items || items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/30 p-4 text-center text-muted-foreground">
          No line items
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={8} className="bg-muted/30 p-0">
        <div className="px-8 py-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase text-muted-foreground">Product</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">SKU</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Qty</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Unit Price</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-transparent border-muted">
                  <TableCell className="font-medium">{item.product_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{item.product_sku || "—"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${Number(item.line_total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Page ───
export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [pos, setPOs] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const loadPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = (await apiClient.getPurchaseOrders(
        params as Parameters<typeof apiClient.getPurchaseOrders>[0]
      )) as PaginatedResponse<PurchaseOrderListItem>;
      setPOs(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch {
      setPOs([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  const loadCounts = useCallback(async () => {
    try {
      const statuses = ["draft", "approved", "completed", "cancelled", "pending_stock"];
      const counts: Record<string, number> = {};
      const results = await Promise.all(
        statuses.map(
          (s) =>
            apiClient.getPurchaseOrders({ page: 1, page_size: 1, status: s }) as Promise<
              PaginatedResponse<PurchaseOrderListItem>
            >
        )
      );
      statuses.forEach((s, i) => {
        counts[s] = results[i].total;
      });
      setStatusCounts(counts);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadPOs();
  }, [loadPOs]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const handleCardClick = (status: string) => {
    setStatusFilter((prev) => (prev === status ? "all" : status));
    setPage(1);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this purchase order?")) return;
    try {
      await apiClient.deletePurchaseOrder(id);
      toast.success("Purchase order deleted");
      loadPOs();
      loadCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="mt-1 text-muted-foreground">Manage your purchase orders</p>
        </div>
        <Link
          href="/purchase-orders/new"
          className={cn(buttonVariants({ size: "lg" }), "gradient-primary text-white border-0 shadow-md hover:opacity-90 hover:shadow-lg transition-all")}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Link>
      </div>

      {/* Dashboard Cards */}
      <PODashboard data={statusCounts} activeStatus={statusFilter} onCardClick={handleCardClick} />

      {/* Table List */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v ?? "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
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

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : pos.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <PlusIcon className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-medium">No purchase orders found</p>
              <p className="mt-1 text-sm">Try adjusting your search or filters</p>
              <Link
                href="/purchase-orders/new"
                className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
              >
                Create your first PO
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map((po) => (
                    <React.Fragment key={po.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggleExpand(po.id)}>
                        <TableCell>
                          {expandedId === po.id ? (
                            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{po.reference_number}</TableCell>
                        <TableCell>{po.vendor_name || "Unknown"}</TableCell>
                        <TableCell className="text-center">{po.items_count}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[po.status]}>
                            {po.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          $
                          {Number(po.total).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(po.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="View / Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/purchase-orders/${po.id}`);
                              }}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                              onClick={(e) => handleDelete(po.id, e)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === po.id && <POLineItems poId={po.id} />}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {total > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(v) => {
                        setPageSize(Number(v));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-17.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
