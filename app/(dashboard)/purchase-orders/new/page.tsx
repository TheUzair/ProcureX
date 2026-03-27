"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchaseOrderSchema } from "@/lib/validators";
import { apiClient } from "@/lib/api-client";
import type { Vendor, Product, PaginatedResponse } from "@/types";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { z } from "zod";

type POFormData = z.infer<typeof purchaseOrderSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<POFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      vendor_id: "",
      items: [{ product_id: "", quantity: 1 }],
      shipping_cost: 0,
      discount: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedItems = watch("items");
  const watchedShipping = watch("shipping_cost");
  const watchedDiscount = watch("discount");

  const loadData = useCallback(async () => {
    try {
      const [vendorRes, productRes] = await Promise.all([
        apiClient.getVendors({ page_size: 100 }) as Promise<PaginatedResponse<Vendor>>,
        apiClient.getProducts({ page_size: 100 }) as Promise<PaginatedResponse<Product>>,
      ]);
      setVendors(vendorRes.items);
      setProducts(productRes.items);
    } catch {
      // API not available
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live price calculation
  const subtotal = watchedItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id);
    return sum + Number(product?.unit_price || 0) * (item.quantity || 0);
  }, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax + (watchedShipping || 0) - (watchedDiscount || 0);

  const onSubmit = async (data: POFormData) => {
    try {
      await apiClient.createPurchaseOrder(data as unknown as Record<string, unknown>);
      toast.success("Purchase order created!");
      router.push("/purchase-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create PO");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Purchase Order</h1>
        <p className="text-muted-foreground">Fill in the details for a new purchase order</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Vendor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Select Vendor</Label>
              <Select
                value={watch("vendor_id")}
                onValueChange={(v) => setValue("vendor_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendor_id && (
                <p className="text-sm text-destructive">{errors.vendor_id.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: "", quantity: 1 })}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const product = products.find((p) => p.id === watchedItems[index]?.product_id);
              return (
                <div key={field.id} className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={watchedItems[index]?.product_id || ""}
                      onValueChange={(v) => setValue(`items.${index}.product_id`, v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — ${p.unit_price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.product_id && (
                      <p className="text-sm text-destructive">
                        {errors.items[index].product_id?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-24 space-y-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="w-24 pt-2 text-right text-sm font-medium">
                    ${(Number(product?.unit_price || 0) * (watchedItems[index]?.quantity || 0)).toFixed(2)}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            {errors.items?.message && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Additional costs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Shipping Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("shipping_cost", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("discount", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Optional notes..." {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>${(watchedShipping || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-${(watchedDiscount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gradient-primary text-white border-0 hover:opacity-90"
          >
            {isSubmitting ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
