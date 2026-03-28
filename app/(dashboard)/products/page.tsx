"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, SparklesIcon, CubeIcon } from "@heroicons/react/24/outline";
import { productSchema, type ProductFormData } from "@/lib/validators";
import { apiClient } from "@/lib/api-client";
import type { Product, PaginatedResponse } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({ resolver: zodResolver(productSchema) });

  const watchedName = watch("name");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await apiClient.getProducts({ page_size: 100, search: search || undefined })) as PaginatedResponse<Product>;
      setProducts(res.items);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    reset({ name: "", sku: "", category: "", description: "", unit_price: 0, stock_quantity: 0 });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      category: product.category || "",
      description: product.description || "",
      unit_price: product.unit_price,
      stock_quantity: product.stock_quantity,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await apiClient.updateProduct(editingProduct.id, data as unknown as Record<string, unknown>);
        toast.success("Product updated");
      } else {
        await apiClient.createProduct(data as unknown as Record<string, unknown>);
        toast.success("Product created");
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.deleteProduct(id);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const generateDescription = async () => {
    if (!watchedName) {
      toast.error("Enter a product name first");
      return;
    }
    setAiLoading(true);
    try {
      const res = (await apiClient.generateDescription(watchedName, watch("category") || "")) as { description: string };
      setValue("description", res.description);
      toast.success("AI description generated!");
    } catch {
      toast.error("AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} className="gradient-primary text-white border-0 shadow-md hover:opacity-90 hover:shadow-lg transition-all" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Product
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} placeholder="Product name" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input {...register("sku")} placeholder="SKU-001" />
                  {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input {...register("category")} placeholder="e.g. Electronics" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateDescription}
                    disabled={aiLoading}
                    className="text-primary"
                  >
                    <SparklesIcon className="mr-1 h-4 w-4" />
                    {aiLoading ? "Generating..." : "AI Generate"}
                  </Button>
                </div>
                <Textarea {...register("description")} rows={3} placeholder="Product description..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unit Price ($)</Label>
                  <Input type="number" step="0.01" min="0" {...register("unit_price", { valueAsNumber: true })} />
                  {errors.unit_price && <p className="text-sm text-destructive">{errors.unit_price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input type="number" min="0" {...register("stock_quantity", { valueAsNumber: true })} />
                  {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>}
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary text-white border-0 hover:opacity-90">
                {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <CubeIcon className="h-8 w-8" />
            </div>
            <p className="mt-4 text-base font-medium">No products found</p>
            <p className="mt-1 text-sm">Add your first product to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="card-hover">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.category && <Badge variant="secondary">{product.category}</Badge>}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">${Number(product.unit_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stock</span>
                  <span className={`font-medium ${product.stock_quantity < 10 ? "text-destructive" : ""}`}>
                    {product.stock_quantity}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
