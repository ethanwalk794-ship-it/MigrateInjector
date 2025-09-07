'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    jobTitle?: string;
    phone?: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    preferences: {
        theme: 'light' | 'dark' | 'auto';
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        language: string;
    };
    subscription: {
        plan: 'free' | 'pro' | 'enterprise';
        status: 'active' | 'cancelled' | 'expired';
        expiresAt?: string;
        features: string[];
    };
    usage: {
        resumesProcessed: number;
        emailsSent: number;
        storageUsed: number;
        lastResetAt: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: RegisterData) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData.data);
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setLoading(true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.data.token);
                setUser(data.data.user);
                toast.success('Login successful!');
                return true;
            } else {
                toast.error(data.error || 'Login failed');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: RegisterData): Promise<boolean> => {
        try {
            setLoading(true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.data.token);
                setUser(data.data.user);
                toast.success('Registration successful!');
                return true;
            } else {
                toast.error(data.error || 'Registration failed');
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Registration failed. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            router.push('/');
            toast.success('Logged out successfully');
        }
    };

    const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.data);
                toast.success('Profile updated successfully!');
                return true;
            } else {
                toast.error(data.error || 'Update failed');
                return false;
            }
        } catch (error) {
            console.error('Update user error:', error);
            toast.error('Update failed. Please try again.');
            return false;
        }
    };

    const refreshUser = async (): Promise<void> => {
        await checkAuth();
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
    };

    return (
        <AuthContext.Provider value= { value } >
        { children }
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
    Component: React.ComponentType<P>
): React.ComponentType<P> {
    return function AuthenticatedComponent(props: P) {
        const { user, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !user) {
                router.push('/auth/login');
            }
        }, [user, loading, router]);

        if (loading) {
            return <div>Loading...</div>;
        }

        if (!user) {
            return null;
        }

        return <Component {...props} />;
    };
}


