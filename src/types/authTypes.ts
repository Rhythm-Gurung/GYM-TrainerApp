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
  id: string;
  email: string;
  username: string;
  is_trainer: boolean;
  business_name?: string;
  profile_image?: string;
  role?: 'client' | 'trainer';
  // Add other user fields as needed
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
