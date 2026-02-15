import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import type {
  TrainerRegisterInput,
  TrainerRegisterResponse,
} from '@/types/trainerTypes';

export const trainerService = {
  /**
   * Register a new trainer with extended details
   * @param input - Trainer registration data including credentials and professional details
   * @returns Registration response with status and message
   */
  register: async (input: TrainerRegisterInput): Promise<TrainerRegisterResponse> => {
    // Prepare form data for file uploads
    const formData = new FormData();

    // Add basic auth fields
    formData.append('email', input.email?.trim().toLowerCase() || '');
    formData.append('password', input.password?.trim() || '');
    formData.append('confirm_password', input.confirmPassword?.trim() || '');

    // Add trainer-specific fields
    formData.append('full_name', input.fullName?.trim() || '');
    formData.append('bio', input.bio?.trim() || '');
    formData.append('contact_no', input.contactNo?.trim() || '');
    formData.append('years_of_experience', input.yearsOfExperience.toString());
    formData.append('pricing_per_session', input.pricingPerSession.toString());
    formData.append('session_type', input.sessionType);
    formData.append('role', 'trainer');

    // Add expertise categories as array
    if (input.expertiseCategories && input.expertiseCategories.length > 0) {
      input.expertiseCategories.forEach((category) => {
        formData.append('expertise_categories[]', category);
      });
    }

    // Add file uploads if present
    if (input.certifications && input.certifications.length > 0) {
      input.certifications.forEach((cert, index) => {
        formData.append(`certifications[${index}]`, {
          uri: cert.uri,
          name: cert.name,
          type: cert.type,
        } as unknown as Blob);
      });
    }

    if (input.idProof) {
      formData.append('id_proof', {
        uri: input.idProof.uri,
        name: input.idProof.name,
        type: input.idProof.type,
      } as unknown as Blob);
    }

    if (input.profileImage) {
      formData.append('profile_image', {
        uri: input.profileImage.uri,
        name: input.profileImage.name,
        type: input.profileImage.type,
      } as unknown as Blob);
    }

    // Add availability preference if present
    if (input.availabilityPreference) {
      formData.append('availability_preference', JSON.stringify(input.availabilityPreference));
    }

    const { data } = await apiClient.post<TrainerRegisterResponse>(
      API_CONFIG.ENDPOINTS.TRAINER.REGISTER,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  },

  /**
   * Get trainer profile
   * @returns Trainer profile data
   */
  getProfile: async (): Promise<unknown> => {
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.TRAINER.GET_PROFILE);
    return data;
  },

  /**
   * Update trainer profile
   * @param input - Updated trainer data
   * @returns Updated trainer profile
   */
  updateProfile: async (input: Partial<TrainerRegisterInput>): Promise<unknown> => {
    const formData = new FormData();

    // Add fields that need to be updated
    if (input.fullName) formData.append('full_name', input.fullName.trim());
    if (input.bio) formData.append('bio', input.bio.trim());
    if (input.contactNo) formData.append('contact_no', input.contactNo.trim());
    if (input.yearsOfExperience !== undefined) {
      formData.append('years_of_experience', input.yearsOfExperience.toString());
    }
    if (input.pricingPerSession !== undefined) {
      formData.append('pricing_per_session', input.pricingPerSession.toString());
    }
    if (input.sessionType) formData.append('session_type', input.sessionType);

    if (input.expertiseCategories) {
      input.expertiseCategories.forEach((category) => {
        formData.append('expertise_categories[]', category);
      });
    }

    if (input.profileImage) {
      formData.append('profile_image', {
        uri: input.profileImage.uri,
        name: input.profileImage.name,
        type: input.profileImage.type,
      } as unknown as Blob);
    }

    const { data } = await apiClient.put(
      API_CONFIG.ENDPOINTS.TRAINER.UPDATE_PROFILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  },
};
