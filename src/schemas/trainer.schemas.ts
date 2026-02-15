import { z } from 'zod';

// Trainer Register Schema (Step 1 - email & password)
export const trainerRegisterSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(10, 'Password must not exceed 10 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Trainer Additional Details Schema (Step 2 - trainer-specific details)
export const trainerAdditionalDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  contactNo: z
    .string()
    .min(1, 'Contact number is required')
    .max(10, 'Contact number must not exceed 10 digits')
    .regex(/^\d+$/, 'Contact number must contain only numbers'),
  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio must not exceed 500 characters'),
  expertiseCategories: z
    .array(z.string())
    .min(1, 'Please select at least one expertise category'),
  yearsOfExperience: z
    .number()
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience seems too high'),
  pricingPerSession: z
    .number()
    .min(1, 'Price per session must be at least 1')
    .max(100000, 'Price per session seems too high'),
  sessionType: z.enum(['online', 'offline', 'both'], {
    errorMap: () => ({ message: 'Please select a session type' }),
  }),
});

// Export types from schemas
export type TrainerRegisterFormData = z.infer<typeof trainerRegisterSchema>;
export type TrainerAdditionalDetailsFormData = z.infer<typeof trainerAdditionalDetailsSchema>;
