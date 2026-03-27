"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { vendorSchema, type VendorFormData } from "@/lib/validators";
import { apiClient } from "@/lib/api-client";
import type { Vendor, PaginatedResponse } from "@/types";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormData>({ resolver: zodResolver(vendorSchema) });

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await apiClient.getVendors({ page_size: 100, search: search || undefined })) as PaginatedResponse<Vendor>;
      setVendors(res.items);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const openCreate = () => {
    setEditingVendor(null);
    reset({ name: "", email: "", phone: "", address: "", city: "", country: "" });
    setDialogOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    reset({
      name: vendor.name,
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      city: vendor.city || "",
      country: vendor.country || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: VendorFormData) => {
    try {
      if (editingVendor) {
        await apiClient.updateVendor(editingVendor.id, data as unknown as Record<string, unknown>);
        toast.success("Vendor updated");
      } else {
        await apiClient.createVendor(data as unknown as Record<string, unknown>);
        toast.success("Vendor created");
      }
      setDialogOpen(false);
      loadVendors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await apiClient.deleteVendor(id);
      toast.success("Vendor deleted");
      loadVendors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor directory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} className="gradient-primary text-white border-0 hover:opacity-90" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Vendor
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name")} placeholder="Vendor name" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} placeholder="email@vendor.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register("phone")} placeholder="+1234567890" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register("address")} placeholder="Street address" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register("city")} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input {...register("country")} placeholder="Country" />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary text-white border-0 hover:opacity-90">
                {isSubmitting ? "Saving..." : editingVendor ? "Update Vendor" : "Create Vendor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No vendors found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-base">{vendor.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(vendor)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(vendor.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {vendor.email && <p>{vendor.email}</p>}
                {vendor.phone && <p>{vendor.phone}</p>}
                {(vendor.city || vendor.country) && (
                  <p>{[vendor.city, vendor.country].filter(Boolean).join(", ")}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
