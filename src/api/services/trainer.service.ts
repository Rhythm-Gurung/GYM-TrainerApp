    import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import type {
  CertificationListItem,
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
    formData.append('is_trainer', 'true');

    // expertise_categories sent as a JSON string e.g. ["yoga","cardio"]
    formData.append(
      'expertise_categories',
      JSON.stringify(input.expertiseCategories ?? []),
    );

    // Repeat 'certifications' key for each file (no array indexing)
    if (input.certifications && input.certifications.length > 0) {
      input.certifications.forEach((cert) => {
        formData.append('certifications', {
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
    );

    return data;
  },

  /**
   * Get trainer profile
   */
  getProfile: async (): Promise<unknown> => {
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.TRAINER.GET_PROFILE);
    return data;
  },

  /**
   * Returns the URL of the trainer's ID proof image.
   * Pass with Authorization header when used as an Image source.
   */
  getIdProofUrl: (): string => `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINER.ID_PROOF}`,

  /**
   * List all trainer certifications.
   * Response: { status: true, data: [{ id, name, content_type, created_at, image_url }] }
   */
  getCertifications: async (): Promise<CertificationListItem[]> => {
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.TRAINER.CERTIFICATIONS);
    const result = data.data ?? data.results ?? data;
    return Array.isArray(result) ? result : [];
  },

  /**
   * Returns the URL of a single certification image by ID.
   * Pass with Authorization header when used as an Image source.
   */
  getCertificationImageUrl: (certId: number): string =>
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRAINER.CERTIFICATIONS}${certId}/`,

  /**
   * Upload one or more certification images.
   */
  uploadCertifications: async (files: { uri: string; name: string; type: string }[]): Promise<void> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('certifications', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
    });
    await apiClient.post(API_CONFIG.ENDPOINTS.TRAINER.CERTIFICATIONS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete a single certification by ID.
   */
  deleteCertification: async (certId: number): Promise<void> => {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.TRAINER.CERTIFICATIONS}${certId}/`);
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
      formData.append('expertise_categories', JSON.stringify(input.expertiseCategories));
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
