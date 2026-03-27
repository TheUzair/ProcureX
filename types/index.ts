// ─── Shared TypeScript types for ProcureX ───

export type POStatus = "draft" | "approved" | "completed" | "cancelled" | "pending_stock";

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  mobile: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  description: string | null;
  unit_price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POItem {
  id: string;
  product_id: string;
  product_name: string | null;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  reference_number: string;
  vendor_id: string;
  vendor_name: string | null;
  status: POStatus;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount: number;
  total: number;
  notes: string | null;
  items: POItem[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PurchaseOrderListItem {
  id: string;
  reference_number: string;
  vendor_id: string;
  vendor_name: string | null;
  status: POStatus;
  total: number;
  items_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  user_id: string | null;
  username: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
