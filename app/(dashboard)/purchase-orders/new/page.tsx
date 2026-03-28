"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import type { Vendor, Product, PaginatedResponse } from "@/types";

interface LineItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_sku: string;
  amount: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form header fields
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Line items
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: "", quantity: 1, unit_price: 0, product_name: "", product_sku: "", amount: 0 },
  ]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, productRes] = await Promise.all([
        apiClient.getVendors({ page_size: 100 }) as Promise<PaginatedResponse<Vendor>>,
        apiClient.getProducts({ page_size: 100 }) as Promise<PaginatedResponse<Product>>,
      ]);
      setVendors(vendorRes.items);
      setProducts(productRes.items);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Line item handlers ───
  const handleLineProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_id: productId,
        unit_price: Number(product?.unit_price || 0),
        product_name: product?.name || "",
        product_sku: product?.sku || "",
        amount: Number(product?.unit_price || 0) * (updated[index].quantity || 0),
      };
      return updated;
    });
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: qty,
        amount: (updated[index].unit_price || 0) * qty,
      };
      return updated;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { product_id: "", quantity: 1, unit_price: 0, product_name: "", product_sku: "", amount: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Calculations ───
  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax + shippingCost - discount;

  // ─── Validation ───
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!vendorId) errs.vendor = "Vendor is required";
    const validLines = lines.filter((l) => l.product_id);
    if (validLines.length === 0) errs.items = "At least one item is required";
    lines.forEach((l, i) => {
      if (!l.product_id) errs[`line_${i}_product`] = "Select a product";
      if (!l.quantity || l.quantity < 1) errs[`line_${i}_qty`] = "Qty must be >= 1";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await apiClient.createPurchaseOrder({
        vendor_id: vendorId,
        items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        shipping_cost: shippingCost,
        discount,
        notes,
      });
      toast.success("Purchase order created!");
      router.push("/purchase-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
        <p className="mt-1 text-muted-foreground">Fill in the details for a new purchase order</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* ─── Header Fields ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Vendor <span className="text-destructive">*</span>
              </Label>
              <Combobox
                items={vendors}
                itemToStringValue={(v) => v.name}
                value={vendors.find((v) => v.id === vendorId) ?? null}
                onValueChange={(v) => setVendorId(v?.id ?? "")}
              >
                <ComboboxInput placeholder="Search vendors..." className="w-full" />
                <ComboboxContent>
                  <ComboboxEmpty>No vendors found.</ComboboxEmpty>
                  <ComboboxList>
                    {(vendor) => (
                      <ComboboxItem key={vendor.id} value={vendor}>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          {vendor.email && <p className="text-xs text-muted-foreground">{vendor.email}</p>}
                        </div>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {errors.vendor && <p className="text-sm text-destructive">{errors.vendor}</p>}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks..."
                rows={1}
              />
            </div>
          </div>

          <Separator />

          {/* ─── Line Items ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-lg font-semibold">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>
            {errors.items && <p className="text-sm text-destructive mb-2">{errors.items}</p>}

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs uppercase">Product</TableHead>
                    <TableHead className="text-xs uppercase w-24">SKU</TableHead>
                    <TableHead className="text-xs uppercase w-28 text-right">Qty</TableHead>
                    <TableHead className="text-xs uppercase w-32 text-right">Unit Price</TableHead>
                    <TableHead className="text-xs uppercase w-32 text-right">Amount</TableHead>
                    <TableHead className="text-xs uppercase w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No lines added. Click &quot;Add Line&quot; to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, index) => (
                      <TableRow key={index}>
                        {/* Product */}
                        <TableCell className="py-2">
                          <Combobox
                            items={products}
                            itemToStringValue={(p) => p.name}
                            value={products.find((p) => p.id === line.product_id) ?? null}
                            onValueChange={(p) => handleLineProductChange(index, p?.id ?? "")}
                          >
                            <ComboboxInput placeholder="Search products..." className="min-w-[220px]" />
                            <ComboboxContent>
                              <ComboboxEmpty>No products found.</ComboboxEmpty>
                              <ComboboxList>
                                {(product) => (
                                  <ComboboxItem key={product.id} value={product}>
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-xs text-muted-foreground">{product.sku} — ${Number(product.unit_price).toFixed(2)}</p>
                                    </div>
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                          {errors[`line_${index}_product`] && (
                            <p className="text-xs text-destructive mt-1">
                              {errors[`line_${index}_product`]}
                            </p>
                          )}
                        </TableCell>
                        {/* SKU */}
                        <TableCell className="text-muted-foreground text-sm py-2">
                          {line.product_sku || "—"}
                        </TableCell>
                        {/* Quantity */}
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineQtyChange(index, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-24 text-right ml-auto"
                          />
                          {errors[`line_${index}_qty`] && (
                            <p className="text-xs text-destructive mt-1">
                              {errors[`line_${index}_qty`]}
                            </p>
                          )}
                        </TableCell>
                        {/* Unit Price */}
                        <TableCell className="text-right font-medium py-2">
                          ${line.unit_price.toFixed(2)}
                        </TableCell>
                        {/* Amount */}
                        <TableCell className="text-right font-semibold py-2">
                          ${line.amount.toFixed(2)}
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-center py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={lines.length <= 1}
                            onClick={() => removeLine(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Total Amount */}
            <div className="flex justify-end mt-2">
              <p className="text-sm font-semibold">
                Items Total:
                <span className="ml-2 text-base">${subtotal.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <Separator />

          {/* ─── Additional Costs ─── */}
          <div>
            <Label className="text-lg font-semibold mb-3 block">Additional Costs</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shipping Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ─── Order Summary ─── */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2.5 rounded-xl bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span className="tabular-nums">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums text-green-600">-${discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* ─── Actions ─── */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              className="gradient-primary text-white border-0 shadow-md hover:opacity-90 hover:shadow-lg transition-all"
              onClick={handleSubmit}
            >
              {isSubmitting ? "Creating..." : "Create Purchase Order"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
