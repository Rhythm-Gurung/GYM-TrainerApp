import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

// Register Schema
export const registerSchema = z
    .object({
        username: z.string().min(1, 'Username is required'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Please enter a valid email address'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters')
            .max(20, 'Password must not exceed 20 characters')
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

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email is required'),
    // .email("Please enter a valid email address"),
});

// Verify Email Schema
export const verifyEmailSchema = z.object({
    email: z.string().min(1, 'Email is required'),
    // .email("Please enter a valid email address"),
    code: z
        .string()
        .min(1, 'Verification code is required')
        .length(6, 'Verification code must be 6 digits')
        .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

// Change Password Schema
export const changePasswordSchema = z
    .object({
        email: z.string(),
        newPassword: z
            .string()
            .min(1, 'New password is required')
            .min(8, 'Password must be at least 8 characters')
            .max(20, 'Password must not exceed 20 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
        confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    });

// Export types from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
