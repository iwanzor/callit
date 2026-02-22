import { z } from "zod";

// Auth validations
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must not exceed 100 characters")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must not exceed 100 characters")
    .optional(),
});

// Order validations
export const createOrderSchema = z.object({
  marketId: z.string().uuid("Invalid market ID"),
  side: z.enum(["yes", "no"]),
  type: z.enum(["limit", "market"]),
  price: z
    .number()
    .min(0.01, "Price must be at least 0.01")
    .max(0.99, "Price must be at most 0.99")
    .optional(),
  quantity: z
    .number()
    .positive("Quantity must be positive")
    .max(1000000, "Quantity too large"),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
