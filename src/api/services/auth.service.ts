import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import type {
    ChangePasswordInput,
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

    checkEmailExists: async (email: string): Promise<{ exists: boolean; can_reapply: boolean }> => {
        const { data } = await apiClient.post<{ exists: boolean; can_reapply: boolean }>(
            API_CONFIG.ENDPOINTS.AUTH.CHECK_EMAIL,
            { email: email?.trim().toLowerCase() || '' },
        );
        return data;
    },

    register: async (input: RegisterInput): Promise<RegisterResponse> => {
        if (!input.isTrainer) {
            // Client registration — plain JSON
            const { data } = await apiClient.post<RegisterResponse>(
                API_CONFIG.ENDPOINTS.AUTH.REGISTER,
                {
                    email: input.email?.trim().toLowerCase() || '',
                    password: input.password?.trim() || '',
                    confirm_password: input.confirmPassword?.trim() || '',
                    username: input.username?.trim() || '',
                    is_trainer: false,
                },
            );
            return data;
        }

        // Trainer registration — multipart/form-data
        const formData = new FormData();
        formData.append('email', input.email?.trim().toLowerCase() || '');
        formData.append('password', input.password?.trim() || '');
        formData.append('confirm_password', input.confirmPassword?.trim() || '');
        formData.append('username', input.username?.trim() || '');
        formData.append('is_trainer', 'true');
        formData.append('full_name', input.fullName?.trim() || '');
        formData.append('contact_no', input.contactNo?.trim() || '');
        formData.append('bio', input.bio?.trim() || '');
        formData.append('years_of_experience', String(input.yearsOfExperience ?? 0));
        formData.append('pricing_per_session', String(input.pricingPerSession ?? 0));
        formData.append('session_type', input.sessionType ?? 'both');
        // expertise_categories sent as a JSON string e.g. ["yoga","cardio"]
        formData.append('expertise_categories', JSON.stringify(input.expertiseCategories ?? []));

        if (input.profileImage) {
            formData.append('profile_image', {
                uri: input.profileImage.uri,
                name: input.profileImage.name,
                type: input.profileImage.type,
            } as unknown as Blob);
        }

        if (input.idProof) {
            formData.append('id_proof', {
                uri: input.idProof.uri,
                name: input.idProof.name,
                type: input.idProof.type,
            } as unknown as Blob);
        }

        // Repeat 'certifications' key for each file (no array indexing)
        (input.certifications ?? []).forEach((cert) => {
            formData.append('certifications', {
                uri: cert.uri,
                name: cert.name,
                type: cert.type,
            } as unknown as Blob);
        });

        const { data } = await apiClient.post<RegisterResponse>(
            API_CONFIG.ENDPOINTS.AUTH.REGISTER,
            formData,
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
            API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
            {
                email: input.email?.trim().toLowerCase() || '',
                new_password: input.newPassword?.trim() || '',
                confirm_new_password: input.confirmNewPassword?.trim() || '',
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
