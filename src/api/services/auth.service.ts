import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import type {
    ChangePasswordInput,
    GoogleLoginResponse,
    LoginResponse,
    RegisterInput,
    RegisterResponse,
    UpdateProfileInput,
    User,
} from '@/types/authTypes';

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data } = await apiClient.post<LoginResponse>(
            API_CONFIG.ENDPOINTS.AUTH.LOGIN,
            {
                email: email?.trim().toLowerCase() || '',
                password: password?.trim() || '',
            },
        );
        return data;
    },

    googleLogin: async (idToken: string): Promise<GoogleLoginResponse> => {
        const { data } = await apiClient.post<GoogleLoginResponse>(
            API_CONFIG.ENDPOINTS.AUTH.GOOGLE_LOGIN,
            { id_token: idToken },
        );
        return data;
    },

    checkEmailExists: async (email: string): Promise<{ exists: boolean }> => {
        const { data } = await apiClient.post<{ exists: boolean }>(
            API_CONFIG.ENDPOINTS.AUTH.CHECK_EMAIL,
            { email: email?.trim().toLowerCase() || '' },
        );
        return data;
    },

    register: async (input: RegisterInput): Promise<RegisterResponse> => {
        const { data } = await apiClient.post<RegisterResponse>(
            API_CONFIG.ENDPOINTS.AUTH.REGISTER,
            {
                email: input.email?.trim().toLowerCase() || '',
                password: input.password?.trim() || '',
                confirm_password: input.confirmPassword?.trim() || '',
                business_name: input.businessName?.trim() || '',
                username: input.ownerName?.trim() || '',
                address: input.address?.trim() || '',
                pan_vat_no: input.panVatNo?.trim() || '',
                contact_no: input.contactNo?.trim() || '',
                business_type: input.businessType?.trim() || '',
                agree_company_policies: input.agreeCompanyPolicies,
                receive_news: input.receiveNews,
            },
        );
        return data;
    },

    logout: async (): Promise<void> => {
        await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const { data } = await apiClient.post(
            API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
            { email: email?.trim().toLowerCase() || '' },
        );
        return data;
    },

    verifyEmail: async (
        email: string,
        code: string,
    ): Promise<{ message: string }> => {
        const { data } = await apiClient.post(
            API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
            {
                email: email?.trim().toLowerCase() || '',
                verification_code: code?.trim() || '',
            },
        );
        return data;
    },

    verifyForgotPassword: async (
        email: string,
        code: string,
    ): Promise<{ reset_token: string }> => {
        const { data } = await apiClient.post(
            API_CONFIG.ENDPOINTS.AUTH.VERIFY_FORGOT_PASSWORD,
            {
                email: email?.trim().toLowerCase() || '',
                verification_code: code?.trim() || '',
            },
        );
        return data;
    },

    resendOTP: async (email: string): Promise<{ message: string }> => {
        const { data } = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESEND_OTP, {
            email: email?.trim().toLowerCase() || '',
        });
        return data;
    },

    changePassword: async (
        input: ChangePasswordInput,
    ): Promise<{ message: string }> => {
        const { data } = await apiClient.post(
            API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD,
            {
                new_password: input.newPassword?.trim() || '',
                confirm_new_password: input.confirmNewPassword?.trim() || '',
                reset_token: input.resetToken?.trim() || '',
            },
        );
        return data;
    },

    getProfile: async (): Promise<User> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.WHOAMI);
        return data.user ?? data.data ?? data;
    },

    updateProfile: async (input: UpdateProfileInput): Promise<User> => {
        const { data } = await apiClient.put<User>(
            API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE,
            {
                business_name: input.businessName?.trim(),
                username: input.ownerName?.trim(),
                address: input.address?.trim(),
                pan_vat_no: input.panVatNo?.trim(),
                contact_no: input.contactNo?.trim(),
                business_type: input.businessType?.trim(),
                profile_image: input.profileImage,
            },
        );
        return data;
    },
};
