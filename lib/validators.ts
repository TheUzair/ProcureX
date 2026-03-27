import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().min(1, "Email, username, or mobile is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z
  .object({
    email: z.email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters").max(100),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
    full_name: z.string().max(255).optional(),
    mobile: z.string().max(20).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(255),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  category: z.string().max(100).optional(),
  description: z.string().optional(),
  unit_price: z.number().positive("Price must be greater than 0"),
  stock_quantity: z.number().int().min(0, "Stock cannot be negative"),
});

export const poItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export const purchaseOrderSchema = z.object({
  vendor_id: z.string().min(1, "Vendor is required"),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
  shipping_cost: z.number().min(0),
  discount: z.number().min(0),
  notes: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type VendorFormData = z.infer<typeof vendorSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type POItemFormData = z.infer<typeof poItemSchema>;
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
