import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { Alert } from 'react-native';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signInWithEmail: (email: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signUpWithPassword: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Перевірка поточної сесії
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Слухач змін авторизації
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // 1. Magic Link (існуючий метод)
    const signInWithEmail = async (email: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: 'servicemap://login',
                },
            });

            if (error) throw error;

            Alert.alert(
                'Перевірте пошту',
                'Посилання для входу надіслано на вашу електронну адресу'
            );
        } catch (error: any) {
            Alert.alert('Помилка', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 2. Email + Password (ВХІД)
    const signInWithPassword = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            Alert.alert('Успіх', 'Ви успішно увійшли!');
        } catch (error: any) {
            Alert.alert('Помилка входу', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 3. Email + Password (РЕЄСТРАЦІЯ)
    const signUpWithPassword = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'servicemap://login',
                },
            });

            if (error) throw error;

            Alert.alert(
                'Реєстрація успішна',
                'Перевірте пошту для підтвердження облікового запису'
            );
        } catch (error: any) {
            Alert.alert('Помилка реєстрації', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 4. Вихід
    const signOut = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            Alert.alert('Вихід', 'Ви успішно вийшли з облікового запису');
        } catch (error: any) {
            Alert.alert('Помилка', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                loading,
                signInWithEmail,
                signInWithPassword,
                signUpWithPassword,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
