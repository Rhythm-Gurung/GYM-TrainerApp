// Auth API Response Types
export interface LoginResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
}

export interface GoogleLoginResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
}

export interface RegisterResponse {
  detail: string;
  status: boolean;
}

export interface User {
  id: number;
  uuid?: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  profile_image?: string;
  dob?: string;
  is_email_verified?: boolean;
  is_trainer: boolean;
  role?: 'client' | 'trainer';
  contact_no?: string;
  bio?: string;
  expertise_categories?: string;
  years_of_experience?: number;
  pricing_per_session?: string;
  session_type?: 'online' | 'offline' | 'both';
  id_proof_url?: string | null;
  verification_status?: 'pending' | 'verified' | 're_verification_required' | 'reverification_rejected';
  profile_completion?: number | null;
  is_active?: boolean;
  is_receiving_promotional_email?: boolean;
  agreed_to_policies?: boolean;
  social_provider?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  token: string | null;
  authenticated: boolean | null;
  user: User | null;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Auth Context Types
export interface AuthContextType {
  authState: AuthState;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>;
  googleLogin: (idToken: string) => Promise<GoogleLoginResponse>;
  register: (data: RegisterInput) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ message: string }>;
  verifyForgotPassword: (
    email: string,
    code: string,
  ) => Promise<{ reset_token: string }>;
  resendOTP: (email: string) => Promise<{ message: string }>;
  resendForgotPasswordCode: (email: string) => Promise<{ message: string }>;
  changePassword: (data: ChangePasswordInput) => Promise<{ message: string }>;
  getProfile: () => Promise<User>;
  updateProfile: (data: UpdateProfileInput) => Promise<User>;
}

// Form Input Types
export interface LoginInput {
  email: string;
  password: string;
}

// A file asset returned by expo-document-picker / expo-image-picker
export interface FileAsset {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface RegisterInput {
  // Common fields
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  isTrainer: boolean;
  // Trainer-only fields (required when isTrainer = true)
  fullName?: string;
  contactNo?: string;
  bio?: string;
  expertiseCategories?: string[];
  yearsOfExperience?: number;
  pricingPerSession?: number;
  sessionType?: 'online' | 'offline' | 'both';
  profileImage?: FileAsset;
  idProof?: FileAsset;
  certifications?: FileAsset[];
}

export interface ForgotPasswordInput {
  email: string;
}

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface ChangePasswordInput {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfileInput {
  businessName?: string;
  ownerName?: string;
  address?: string;
  panVatNo?: string;
  contactNo?: string;
  businessType?: string;
  profileImage?: string;
}
