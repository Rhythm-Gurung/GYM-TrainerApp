import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { authService } from '@/api/services/auth.service';
import {
    type AuthContextType,
    type AuthState,
    type ChangePasswordInput,
    type LoginResponse,
    type RegisterInput,
    type RegisterResponse,
    type UpdateProfileInput,
    type User,
} from '@/types/authTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        authenticated: null,
        user: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const
            loadAuthData = async () => {
                try {
                    const [tokenEntry, userEntry] = await AsyncStorage.multiGet([
                        'access_token',
                        'user',
                    ]);

                    const accessToken = tokenEntry[1];
                    const user = userEntry[1] ? JSON.parse(userEntry[1]) : null;

                    if (accessToken && user) {
                        setAuthState({ token: accessToken, authenticated: true, user });
                    }
                } finally {
                    setLoading(false);
                }
            };

        loadAuthData();
    }, []);

    const clearAuthData = useCallback(async () => {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        setAuthState({ token: null, authenticated: false, user: null });
    }, []);

    const login = useCallback(
        async (email: string, password: string, rememberMe = false): Promise<LoginResponse> => {
            const data = await authService.login(email, password);

            const storageData: [string, string][] = [
                ['access_token', data.tokens.access],
                ['refresh_token', data.tokens.refresh],
                ['user', JSON.stringify(data.user)],
            ];

            // Only save email if rememberMe is checked
            if (rememberMe) {
                const savedEmailsStr = await AsyncStorage.getItem('saved_emails');
                const savedEmails: string[] = savedEmailsStr ? JSON.parse(savedEmailsStr) : [];
                const normalizedEmail = email.trim().toLowerCase();

                // Remove email if it already exists (to move it to the front)
                const filteredEmails = savedEmails.filter((e) => e !== normalizedEmail);
                // Add current email to the beginning of the array
                const updatedEmails = [normalizedEmail, ...filteredEmails].slice(0, 10); // Keep max 10 emails

                storageData.push(['saved_emails', JSON.stringify(updatedEmails)]);
            }

            await AsyncStorage.multiSet(storageData);

            setAuthState({
                token: data.tokens.access,
                authenticated: true,
                user: data.user,
            });

            return data;
        },
        [],
    );

    const register = useCallback(
        async (input: RegisterInput): Promise<RegisterResponse> => authService.register(input),
        [],
    );

    const logout = useCallback(async (): Promise<void> => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            if (accessToken) {
                await authService.logout();
            }
        } finally {
            await clearAuthData();
        }
    }, [clearAuthData]);

    const forgotPassword = useCallback(
        async (email: string): Promise<{ message: string }> => authService.forgotPassword(email),
        [],
    );

    const verifyEmail = useCallback(
        async (email: string, code: string): Promise<{ message: string }> => (
            authService.verifyEmail(email, code)
        ),
        [],
    );

    const verifyForgotPassword = useCallback(
        async (email: string, code: string): Promise<{ reset_token: string }> => (
            authService.verifyForgotPassword(email, code)
        ),
        [],
    );

    const resendOTP = useCallback(
        async (email: string): Promise<{ message: string }> => authService.resendOTP(email),
        [],
    );

    const resendForgotPasswordCode = useCallback(
        async (email: string): Promise<{ message: string }> => authService.forgotPassword(email),
        [],
    );

    const changePassword = useCallback(
        async (input: ChangePasswordInput): Promise<{ message: string }> => (
            authService.changePassword(input)
        ),
        [],
    );

    const getProfile = useCallback(async (): Promise<User> => {
        try {
            const userData = await authService.getProfile();
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setAuthState((prev) => ({ ...prev, user: userData }));
            return userData;
        } catch {
            const cached = await AsyncStorage.getItem('user');
            if (cached) return JSON.parse(cached);
            throw new Error('Failed to fetch profile and no cached data available');
        }
    }, []);

    const updateProfile = useCallback(async (input: UpdateProfileInput): Promise<User> => {
        const userData = await authService.updateProfile(input);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setAuthState((prev) => ({ ...prev, user: userData }));
        return userData;
    }, []);

    const value = useMemo<AuthContextType>(
        () => ({
            authState,
            loading,
            login,
            register,
            logout,
            forgotPassword,
            verifyEmail,
            verifyForgotPassword,
            resendOTP,
            resendForgotPasswordCode,
            changePassword,
            getProfile,
            updateProfile,
        }),
        [
            authState,
            loading,
            login,
            register,
            logout,
            forgotPassword,
            verifyEmail,
            verifyForgotPassword,
            resendOTP,
            resendForgotPasswordCode,
            changePassword,
            getProfile,
            updateProfile,
        ],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
