import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .regex(/[a-z]/i, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")) });

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const acceptInviteSchema = z
  .object({ fullName: z.string().trim().min(2, "Enter your name").max(120), password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const setupSchema = z.object({
  agencyName: z.string().trim().min(2, "Enter the agency name").max(120),
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: passwordSchema,
  currency: z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
  timezone: z.string().min(1).max(64),
});
