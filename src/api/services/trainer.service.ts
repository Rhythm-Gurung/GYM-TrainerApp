    import { apiClient } from '@/api/client';
import { authService } from '@/api/services/auth.service';
import { API_CONFIG } from '@/constants/config';
import type { SessionRequestType } from '@/types/clientTypes';
import type { DateOverride, ScheduleOverride, ScheduleScope } from '@/types/trainerAvailability.types';
import type {
    CertificationListItem,
    DaySchedule,
    GalleryItem,
    SessionMode,
    TrainerEarningsResponse,
    TrainerRegisterInput,
    TrainerRegisterResponse,
    TrainerSession,
    TrainerSessionStatus,
} from '@/types/trainerTypes';

function parseMoney(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function pickNonEmpty(...values: unknown[]): string {
  return values
    .map((value) => pickString(value).trim())
    .find((value) => Boolean(value)) || '';
}

function fullNameFromParts(firstName: unknown, lastName: unknown): string {
  const first = pickNonEmpty(firstName);
  const last = pickNonEmpty(lastName);
  if (first && last) return `${first} ${last}`;
  return first || last;
}

function mapApiTrainerSession(item: unknown): TrainerSession {
  const row = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};

  const clientObj = (row.client && typeof row.client === 'object')
    ? (row.client as Record<string, unknown>)
    : null;

  const clientName =
    pickNonEmpty(
      clientObj?.username,
      row.client_username,
      fullNameFromParts(clientObj?.first_name, clientObj?.last_name),
      fullNameFromParts(row.client_first_name, row.client_last_name),
      clientObj?.full_name,
      clientObj?.name,
      row.client_name,
      row.clientName,
      clientObj?.email,
      row.client_email,
    )
    || 'Client';

  const clientId =
    pickString(clientObj?.id)
    || pickString(row.client_id)
    || pickString(row.clientId);

  const clientAvatar =
    pickString(clientObj?.profile_image_url)
    || pickString(clientObj?.avatar_url)
    || pickString(clientObj?.image_url)
    || pickString(row.client_avatar_url)
    || pickString(row.clientAvatar)
    || '';

  const statusRaw = pickString(row.status, 'pending');
  const VALID_STATUSES: TrainerSessionStatus[] = [
    'pending',
    'accepted',
    'confirmed',
    'in_progress',
    'cancelled',
    'refund_pending',
    'refunded',
    'completed',
    'disputed',
    'no_show_client',
    'session_was_taken_but_not_end_by_client',
    'missed',
  ];
  const status: TrainerSessionStatus = VALID_STATUSES.includes(statusRaw as TrainerSessionStatus)
    ? (statusRaw as TrainerSessionStatus)
    : 'pending';

  return {
    id: pickString(row.id),
    bookingId: pickString(row.booking_id ?? row.bookingId ?? row.id),
    clientName,
    clientId,
    clientAvatar: clientAvatar || undefined,
    date: pickString(row.date),
    startTime: pickString(row.start_time ?? row.startTime),
    endTime: pickString(row.end_time ?? row.endTime),
    status,
    totalAmount: parseMoney(row.total_amount ?? row.totalAmount),
  };
}

export const trainerService = {
  /**
   * Accept a pending booking.
   * POST /api/trainer/bookings/{id}/confirm/
   * Booking status moves to "accepted" — client must now pay.
   */
  confirmBooking: async (id: string): Promise<void> => {
    await apiClient.post(`${API_CONFIG.ENDPOINTS.TRAINER.BOOKINGS}${id}/confirm/`);
  },

  /**
   * Reject / cancel a booking as the trainer.
   * POST /api/trainer/bookings/{id}/cancel/
   */
  cancelBookingById: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`${API_CONFIG.ENDPOINTS.TRAINER.BOOKINGS}${id}/cancel/`, { reason });
  },

  /**
   * Create a trainer verification request for a booking.
   * POST /api/trainer/bookings/{booking_id}/session-requests/
   */
  createSessionRequest: async (bookingId: string, requestType: SessionRequestType): Promise<void> => {
    await apiClient.post(
      `${API_CONFIG.ENDPOINTS.TRAINER.BOOKINGS}${bookingId}/session-requests/`,
      { request_type: requestType },
    );
  },

  /**
   * Fetch trainer-visible bookings.
   * Depending on backend, this may be the same /api/bookings/ list used by clients,
   * but filtered server-side for the authenticated trainer.
   */
  getBookings: async (): Promise<TrainerSession[]> => {
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.TRAINER.BOOKINGS);
    const result = data?.data ?? data?.results ?? data;
    if (!Array.isArray(result)) return [];
    return result.map(mapApiTrainerSession);
  },

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
    // Backend does not currently expose a trainer-only "profile stats" endpoint.
    // Use whoami as the canonical source for the current logged-in user's info.
    const user = await authService.getProfile();
    return user;
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
   * Upload / replace the trainer's profile image.
   */
  uploadProfileImage: async (file: { uri: string; name: string; type: string }): Promise<void> => {
    const formData = new FormData();
    formData.append('profile_image', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    await apiClient.put(API_CONFIG.ENDPOINTS.TRAINER.PROFILE_IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Upload / replace the trainer's ID proof image.
   */
  uploadIdProof: async (file: { uri: string; name: string; type: string }): Promise<void> => {
    const formData = new FormData();
    formData.append('id_proof', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    await apiClient.patch(API_CONFIG.ENDPOINTS.TRAINER.ID_PROOF, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * PATCH trainer profile details (personal + professional info).
   * Sends JSON – does not update profile image or documents.
   */
  patchProfileDetails: async (input: {
    first_name: string;
    last_name: string;
    dob?: string;
    full_name: string;
    contact_no: string;
    bio: string;
    location?: string;
    expertise_categories: string[];
    years_of_experience: number;
    pricing_per_session: string;
    session_type: 'online' | 'offline' | 'both';
    is_receiving_promotional_email: boolean;
  }): Promise<unknown> => {
    const { data } = await apiClient.patch(
      API_CONFIG.ENDPOINTS.TRAINER.UPDATE_PROFILE_DETAILS,
      input,
    );
    return data;
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

  /**
   * Fetch the trainer's photo gallery.
   */
  getGallery: async (): Promise<GalleryItem[]> => {
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.TRAINER.GALLERY);
    const candidate =
      data?.data?.images
      ?? data?.data?.items
      ?? data?.data
      ?? data?.results
      ?? data?.images
      ?? data;

    if (!Array.isArray(candidate)) return [];

    return candidate
      .map((item: unknown, index: number) => {
        const row = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
        const imageUrl = row.image_url ?? row.image ?? row.url ?? row.file ?? '';
        return {
          id: Number(row.id ?? index + 1),
          image_url: String(imageUrl),
          caption: row.caption ? String(row.caption) : undefined,
          collection_id: row.collection_id != null ? String(row.collection_id) : null,
          content_type: row.content_type ? String(row.content_type) : undefined,
          created_at: String(row.created_at ?? row.uploaded_at ?? ''),
        };
      })
      .filter((item: GalleryItem) => item.image_url.length > 0);
  },

  /**
   * Upload one or more photos to the trainer's gallery.
   * Returns the newly created gallery items (including collection_id).
   */
  uploadGalleryImages: async (
    files: { uri: string; name: string; type: string }[],
    caption?: string,
  ): Promise<GalleryItem[]> => {
    const formData = new FormData();
    formData.append('type', 'images');
    if (caption?.trim()) formData.append('caption', caption.trim());
    files.forEach((file) => {
      formData.append('images', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
    });
    const { data } = await apiClient.post(API_CONFIG.ENDPOINTS.TRAINER.GALLERY, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const candidate = data?.data ?? data?.results ?? data;
    if (!Array.isArray(candidate)) return [];
    return candidate.map((item: unknown, index: number) => {
      const row = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
      const imageUrl = row.image_url ?? row.image ?? row.url ?? row.file ?? '';
      return {
        id: Number(row.id ?? index + 1),
        image_url: String(imageUrl),
        caption: row.caption ? String(row.caption) : undefined,
        collection_id: row.collection_id != null ? String(row.collection_id) : null,
        content_type: row.content_type ? String(row.content_type) : undefined,
        created_at: String(row.created_at ?? row.uploaded_at ?? ''),
      };
    }).filter((item: GalleryItem) => item.image_url.length > 0);
  },

  /**
   * Update caption of a single gallery image.
   */
  updateGalleryCaption: async (galleryId: number, caption: string): Promise<void> => {
    await apiClient.patch(`${API_CONFIG.ENDPOINTS.TRAINER.GALLERY}${galleryId}/`, {
      caption,
    });
  },

  /**
   * Delete a single gallery image.
   */
  deleteGalleryImage: async (galleryId: number): Promise<void> => {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.TRAINER.GALLERY}${galleryId}/`);
  },

  // ─── Schedule ────────────────────────────────────────────────────────────────

  /**
   * Fetch the trainer's 7-day recurring weekly schedule plus its active scope.
   * Maps snake_case API fields → camelCase DaySchedule type.
   * Always returns 7 items (backend guarantees this even on first load).
   */
  getSchedule: async (): Promise<{ schedule: DaySchedule[]; scope: ScheduleScope | null }> => {
    console.warn('[svc:schedule] GET schedule → request');
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.TRAINER.SCHEDULE);
    console.warn('[svc:schedule] GET schedule ← raw response:', JSON.stringify(data));
    const items: unknown[] = Array.isArray(data?.data) ? data.data : [];
    const schedule = items.map((item: unknown) => {
      const row = item as Record<string, unknown>;
      const rawSlots = Array.isArray(row.slots) ? row.slots : [];
      return {
        dayOfWeek: Number(row.day_of_week ?? 0),
        enabled: Boolean(row.enabled),
        session_mode: (['online', 'offline', 'both'].includes(String(row.session_mode))
          ? String(row.session_mode) as SessionMode
          : 'both'),
        slots: rawSlots.map((s: unknown, idx: number) => {
          const slot = s as Record<string, unknown>;
          return {
            id: `${row.day_of_week}-api-${idx}`,
            startTime: String(slot.start_time ?? '09:00'),
            endTime: String(slot.end_time ?? '10:00'),
          };
        }),
      };
    });
    const scope: ScheduleScope | null = data?.effective_from != null
      ? {
          effective_from: String(data.effective_from),
          effective_until: data.effective_until ? String(data.effective_until) : null,
        }
      : null;
    console.warn('[svc:schedule] GET schedule ← parsed scope:', JSON.stringify(scope));
    console.warn('[svc:schedule] GET schedule ← parsed days:', schedule.length, 'days,', schedule.filter(d => d.enabled).length, 'enabled');
    return { schedule, scope };
  },

  /**
   * Replace the trainer's entire weekly schedule.
   * Always sends all 7 days. slot.id is stripped — backend only needs start/end times.
   * Pass effectiveFrom / effectiveUntil to bound the schedule to a time range;
   * omit both for the current indefinite behavior.
   */
  saveSchedule: async (
    schedule: DaySchedule[],
    effectiveFrom?: string,
    effectiveUntil?: string | null,
  ): Promise<number> => {
    const payload: Record<string, unknown> = {
      schedule: schedule.map((d) => ({
        day_of_week: d.dayOfWeek,
        enabled: d.enabled,
        session_mode: d.session_mode ?? 'both',
        slots: d.slots.map(({ startTime, endTime }) => ({
          start_time: startTime,
          end_time: endTime,
        })),
      })),
    };
    if (effectiveFrom !== undefined) payload.effective_from = effectiveFrom;
    if (effectiveUntil !== undefined) payload.effective_until = effectiveUntil ?? null;
    console.warn('[svc:schedule] PUT schedule → payload:', JSON.stringify(payload));
    const response = await apiClient.put(API_CONFIG.ENDPOINTS.TRAINER.SCHEDULE, payload);
    console.warn('[svc:schedule] PUT schedule ← status:', response.status);
    return response.status;
  },

  // ─── Availability Overrides ───────────────────────────────────────────────────

  /**
   * Fetch date overrides for this trainer.
   * Pass month as "YYYY-MM" (e.g. "2026-03") to filter by month — recommended
   * to keep the response small. Omit for all overrides.
   */
  getDateOverrides: async (month?: string): Promise<DateOverride[]> => {
    const params = month ? { month } : {};
    console.warn('[svc:schedule] GET dateOverrides → params:', JSON.stringify(params));
    const { data } = await apiClient.get(
      API_CONFIG.ENDPOINTS.TRAINER.AVAILABILITY_OVERRIDES,
      { params },
    );
    const items: unknown[] = Array.isArray(data?.data) ? data.data : [];
    const result = items.map((item: unknown) => {
      const row = item as Record<string, unknown>;
      return {
        id: Number(row.id),
        date: String(row.date),
        reason: row.reason ? String(row.reason) : undefined,
      };
    });
    console.warn('[svc:schedule] GET dateOverrides ← count:', result.length, JSON.stringify(result.map(o => o.date)));
    return result;
  },

  /**
   * Block a specific date. Returns the created override including its backend id.
   * Backend returns 400 if the date is already blocked.
   */
  createDateOverride: async (date: string, reason?: string): Promise<{ status: number; override: DateOverride }> => {
    const body: Record<string, string> = { date };
    if (reason) body.reason = reason;
    console.warn('[svc:schedule] POST dateOverride → body:', JSON.stringify(body));
    const { data, status } = await apiClient.post(
      API_CONFIG.ENDPOINTS.TRAINER.AVAILABILITY_OVERRIDES,
      body,
    );
    console.warn('[svc:schedule] POST dateOverride ← status:', status, 'data:', JSON.stringify(data));
    const row = (data?.data ?? data) as Record<string, unknown>;
    return {
      status,
      override: {
        id: Number(row.id),
        date: String(row.date),
        reason: row.reason ? String(row.reason) : undefined,
      },
    };
  },

  /**
   * Update the reason text of an existing override without deleting/re-creating it.
   */
  patchDateOverride: async (overrideId: number, reason: string): Promise<void> => {
    console.warn('[svc:schedule] PATCH dateOverride → id:', overrideId, 'reason:', reason);
    const response = await apiClient.patch(
      `${API_CONFIG.ENDPOINTS.TRAINER.AVAILABILITY_OVERRIDES}${overrideId}/`,
      { reason },
    );
    console.warn('[svc:schedule] PATCH dateOverride ← status:', response.status);
  },

  /**
   * Unblock a specific date — removes the override so the weekly schedule takes over again.
   */
  deleteDateOverride: async (overrideId: number): Promise<number> => {
    console.warn('[svc:schedule] DELETE dateOverride → id:', overrideId);
    const { status } = await apiClient.delete(
      `${API_CONFIG.ENDPOINTS.TRAINER.AVAILABILITY_OVERRIDES}${overrideId}/`,
    );
    console.warn('[svc:schedule] DELETE dateOverride ← status:', status);
    return status;
  },

  // ─── Schedule Overrides (per-week custom schedules) ───────────────────────────

  /**
   * Fetch schedule overrides, optionally filtered to a month (YYYY-MM).
   * Each override covers a specific date range with its own 7-day schedule.
   * Filter by month (YYYY-MM) to keep the response small.
   */
  getScheduleOverrides: async (month?: string): Promise<ScheduleOverride[]> => {
    const params = month ? { month } : {};
    console.warn('[svc:schedule] GET scheduleOverrides → params:', JSON.stringify(params));
    const { data } = await apiClient.get(
      API_CONFIG.ENDPOINTS.TRAINER.SCHEDULE_OVERRIDES,
      { params },
    );
    console.warn('[svc:schedule] GET scheduleOverrides ← raw:', JSON.stringify(data));
    let items: unknown[] = [];
    if (Array.isArray(data?.data)) items = data.data;
    else if (Array.isArray(data)) items = data;
    console.warn('[svc:schedule] GET scheduleOverrides ← count:', items.length);
    return items.map((item: unknown) => {
      const row = item as Record<string, unknown>;
      const rawSchedule = Array.isArray(row.schedule) ? row.schedule : [];
      return {
        id: Number(row.id),
        start_date: String(row.start_date),
        end_date: String(row.end_date),
        schedule: rawSchedule.map((d: unknown) => {
          const day = d as Record<string, unknown>;
          const rawSlots = Array.isArray(day.slots) ? day.slots : [];
          return {
            dayOfWeek: Number(day.day_of_week ?? 0),
            enabled: Boolean(day.enabled),
            session_mode: (['online', 'offline', 'both'].includes(String(day.session_mode))
              ? String(day.session_mode) as SessionMode
              : 'both'),
            slots: rawSlots.map((s: unknown, idx: number) => {
              const slot = s as Record<string, unknown>;
              return {
                id: `${day.day_of_week}-override-${idx}`,
                startTime: String(slot.start_time ?? '09:00'),
                endTime: String(slot.end_time ?? '10:00'),
              };
            }),
          };
        }),
        created_at: row.created_at ? String(row.created_at) : undefined,
        updated_at: row.updated_at ? String(row.updated_at) : undefined,
      };
    });
  },

  /**
   * Create a schedule override for a specific date range.
   * start_date / end_date define the week (or any range) to customize.
   */
  createScheduleOverride: async (
    startDate: string,
    endDate: string,
    schedule: DaySchedule[],
  ): Promise<ScheduleOverride> => {
    const payload = {
      start_date: startDate,
      end_date: endDate,
      schedule: schedule.map((d) => ({
        day_of_week: d.dayOfWeek,
        enabled: d.enabled,
        session_mode: d.session_mode ?? 'both',
        slots: d.slots.map(({ startTime, endTime }) => ({
          start_time: startTime,
          end_time: endTime,
        })),
      })),
    };
    console.warn('[svc:schedule] POST scheduleOverride → payload:', JSON.stringify(payload));
    const { data } = await apiClient.post(
      API_CONFIG.ENDPOINTS.TRAINER.SCHEDULE_OVERRIDES,
      payload,
    );
    console.warn('[svc:schedule] POST scheduleOverride ← data:', JSON.stringify(data));
    const row = (data?.data ?? data) as Record<string, unknown>;
    return (await trainerService.getScheduleOverrides()).find((o) => o.id === Number(row.id))
      ?? { id: Number(row.id), start_date: startDate, end_date: endDate, schedule };
  },

  /**
   * Replace an existing schedule override (dates + schedule).
   */
  updateScheduleOverride: async (
    id: number,
    startDate: string,
    endDate: string,
    schedule: DaySchedule[],
  ): Promise<ScheduleOverride> => {
    const payload = {
      start_date: startDate,
      end_date: endDate,
      schedule: schedule.map((d) => ({
        day_of_week: d.dayOfWeek,
        enabled: d.enabled,
        session_mode: d.session_mode ?? 'both',
        slots: d.slots.map(({ startTime, endTime }) => ({
          start_time: startTime,
          end_time: endTime,
        })),
      })),
    };
    console.warn('[svc:schedule] PUT scheduleOverride → id:', id, 'payload:', JSON.stringify(payload));
    const { data } = await apiClient.put(
      `${API_CONFIG.ENDPOINTS.TRAINER.SCHEDULE_OVERRIDES}${id}/`,
      payload,
    );
    console.warn('[svc:schedule] PUT scheduleOverride ← data:', JSON.stringify(data));
    const row = (data?.data ?? data) as Record<string, unknown>;
    return (await trainerService.getScheduleOverrides()).find((o) => o.id === Number(row.id))
      ?? { id, start_date: startDate, end_date: endDate, schedule };
  },

  /**
   * Delete a schedule override — that week reverts to the default recurring schedule.
   */
  deleteScheduleOverride: async (id: number): Promise<number> => {
    console.warn('[svc:schedule] DELETE scheduleOverride → id:', id);
    const { status } = await apiClient.delete(
      `${API_CONFIG.ENDPOINTS.TRAINER.SCHEDULE_OVERRIDES}${id}/`,
    );
    console.warn('[svc:schedule] DELETE scheduleOverride ← status:', status);
    return status;
  },

  // ─── Earnings ─────────────────────────────────────────────────────────────────

  /**
   * Fetch the trainer's earnings summary and payout history.
   * GET /api/payment/trainer/earnings/
   */
  getEarnings: async (): Promise<TrainerEarningsResponse> => {
    const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.PAYMENT.TRAINER_EARNINGS);
    const raw = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
    const summaryRaw = (raw.summary && typeof raw.summary === 'object')
      ? (raw.summary as Record<string, unknown>)
      : {};
    const payoutsRaw = Array.isArray(raw.payouts) ? raw.payouts : [];

    return {
      summary: {
        total_earned_rs: parseMoney(summaryRaw.total_earned_rs),
        pending_transfer_rs: parseMoney(summaryRaw.pending_transfer_rs),
        on_hold_rs: parseMoney(summaryRaw.on_hold_rs),
        total_bookings_paid: Number(summaryRaw.total_bookings_paid ?? 0),
      },
      payouts: payoutsRaw.map((item: unknown) => {
        const row = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
        return {
          payout_id: Number(row.payout_id ?? 0),
          booking_id: Number(row.booking_id ?? 0),
          client_name: pickString(row.client_name),
          booking_date: pickString(row.booking_date),
          payout_type: pickString(row.payout_type),
          payout_type_label: pickString(row.payout_type_label),
          amount_rs: parseMoney(row.amount_rs),
          status: pickString(row.status, 'pending') as TrainerEarningsResponse['payouts'][number]['status'],
          status_label: pickString(row.status_label),
          transfer_reference: row.transfer_reference ? pickString(row.transfer_reference) : null,
          transferred_at: row.transferred_at ? pickString(row.transferred_at) : null,
        };
      }),
    };
  },

  /**
   * Fetch all reviews for the authenticated trainer.
   * GET /api/trainers/{id}/reviews/
   * Returns: { count, average_rating, data: ApiReview[] }
   */
  getReviews: async (): Promise<unknown> => {
    // Get the authenticated user's ID
    const user = await authService.getProfile();
    const trainerId = user?.id ? String(user.id) : '';
    
    if (!trainerId) {
      throw new Error('Trainer ID not found');
    }

    // Use the client endpoint to fetch reviews for this trainer
    const { data } = await apiClient.get(`/api/trainers/${trainerId}/reviews/`);
    return data;
  },
};
