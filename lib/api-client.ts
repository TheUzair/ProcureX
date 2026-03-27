import type { TokenResponse } from "@/types";

// Client-side: route through /api/proxy → Next.js API route injects auth token → backend
// The proxy rewrites /api/proxy/vendors → /api/vendors on the backend
const API_BASE = "";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Rewrite /api/... → /api/proxy/... so the Next.js catch-all route handles auth
    const proxyEndpoint = endpoint.replace(/^\/api\//, "/api/proxy/");

    const response = await fetch(`${this.baseUrl}${proxyEndpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async login(login: string, password: string) {
    return this.request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    mobile?: string;
  }) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request("/api/auth/me");
  }

  async forgotPassword(email: string) {
    return this.request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  // Vendors
  async getVendors(params?: { page?: number; page_size?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.search) searchParams.set("search", params.search);
    return this.request(`/api/vendors?${searchParams}`);
  }

  async getVendor(id: string) {
    return this.request(`/api/vendors/${id}`);
  }

  async createVendor(data: Record<string, unknown>) {
    return this.request("/api/vendors", { method: "POST", body: JSON.stringify(data) });
  }

  async updateVendor(id: string, data: Record<string, unknown>) {
    return this.request(`/api/vendors/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteVendor(id: string) {
    return this.request(`/api/vendors/${id}`, { method: "DELETE" });
  }

  // Products
  async getProducts(params?: { page?: number; page_size?: number; search?: string; category?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    return this.request(`/api/products?${searchParams}`);
  }

  async getProduct(id: string) {
    return this.request(`/api/products/${id}`);
  }

  async createProduct(data: Record<string, unknown>) {
    return this.request("/api/products", { method: "POST", body: JSON.stringify(data) });
  }

  async updateProduct(id: string, data: Record<string, unknown>) {
    return this.request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteProduct(id: string) {
    return this.request(`/api/products/${id}`, { method: "DELETE" });
  }

  // Purchase Orders
  async getPurchaseOrders(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    vendor_id?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.vendor_id) searchParams.set("vendor_id", params.vendor_id);
    return this.request(`/api/purchase-orders?${searchParams}`);
  }

  async getPurchaseOrder(id: string) {
    return this.request(`/api/purchase-orders/${id}`);
  }

  async createPurchaseOrder(data: Record<string, unknown>) {
    return this.request("/api/purchase-orders", { method: "POST", body: JSON.stringify(data) });
  }

  async updatePurchaseOrder(id: string, data: Record<string, unknown>) {
    return this.request(`/api/purchase-orders/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deletePurchaseOrder(id: string) {
    return this.request(`/api/purchase-orders/${id}`, { method: "DELETE" });
  }

  async updatePOStatus(id: string, status: string) {
    return this.request(`/api/purchase-orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async addPOItem(poId: string, data: { product_id: string; quantity: number }) {
    return this.request(`/api/purchase-orders/${poId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async removePOItem(poId: string, itemId: string) {
    return this.request(`/api/purchase-orders/${poId}/items/${itemId}`, { method: "DELETE" });
  }

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    page_size?: number;
    entity_type?: string;
    entity_id?: string;
    action?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.entity_type) searchParams.set("entity_type", params.entity_type);
    if (params?.entity_id) searchParams.set("entity_id", params.entity_id);
    if (params?.action) searchParams.set("action", params.action);
    return this.request(`/api/audit-logs?${searchParams}`);
  }

  // AI
  async generateDescription(productName: string, category: string) {
    return this.request<{ description: string }>("/api/ai/generate-description", {
      method: "POST",
      body: JSON.stringify({ product_name: productName, category }),
    });
  }

  // PDF
  async downloadPOPdf(id: string) {
    const response = await fetch(`/api/proxy/purchase-orders/${id}/pdf`);
    if (!response.ok) throw new Error("Failed to download PDF");
    return response.blob();
  }
}

export const apiClient = new ApiClient(API_BASE);
