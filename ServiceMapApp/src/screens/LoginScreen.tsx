// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [loginMethod, setLoginMethod] = useState<'magic' | 'password'>('magic');

    const {
        signInWithEmail,
        signInWithPassword,
        signUpWithPassword,
        loading,
    } = useAuth();

    const handleSubmit = async () => {
        if (!email) {
            alert('Будь ласка, введіть email');
            return;
        }

        try {
            if (loginMethod === 'magic') {
                await signInWithEmail(email);
            } else {
                if (!password || password.length < 6) {
                    alert('Пароль має містити мінімум 6 символів');
                    return;
                }

                if (authMode === 'signin') {
                    await signInWithPassword(email, password);
                    navigation.navigate('Home');
                } else {
                    await signUpWithPassword(email, password);
                }
            }
        } catch (error) {
            // Помилка вже оброблена в AuthContext
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Логотип */}
                    <Text style={styles.logo}>🇨🇾</Text>
                    <Text style={styles.title}>ServiceMap Cyprus</Text>
                    <Text style={styles.subtitle}>
                        {authMode === 'signin' ? 'Вхід в профіль' : 'Створити обліковий запис'}
                    </Text>

                    {/* Переключатель методів входу */}
                    <View style={styles.methodSwitcher}>
                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                loginMethod === 'magic' && styles.methodButtonActive,
                            ]}
                            onPress={() => setLoginMethod('magic')}
                        >
                            <Text
                                style={[
                                    styles.methodButtonText,
                                    loginMethod === 'magic' && styles.methodButtonTextActive,
                                ]}
                            >
                                📧 Magic Link
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                loginMethod === 'password' && styles.methodButtonActive,
                            ]}
                            onPress={() => setLoginMethod('password')}
                        >
                            <Text
                                style={[
                                    styles.methodButtonText,
                                    loginMethod === 'password' && styles.methodButtonTextActive,
                                ]}
                            >
                                🔑 Email + Пароль
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                    />

                    {/* Password input (тільки для password методу) */}
                    {loginMethod === 'password' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Пароль (мін. 6 символів)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!loading}
                            />

                            {/* Переключатель вхід/реєстрація */}
                            <View style={styles.authModeSwitcher}>
                                <TouchableOpacity onPress={() => setAuthMode('signin')}>
                                    <Text
                                        style={[
                                            styles.authModeText,
                                            authMode === 'signin' && styles.authModeTextActive,
                                        ]}
                                    >
                                        Вхід
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.authModeSeparator}>|</Text>
                                <TouchableOpacity onPress={() => setAuthMode('signup')}>
                                    <Text
                                        style={[
                                            styles.authModeText,
                                            authMode === 'signup' && styles.authModeTextActive,
                                        ]}
                                    >
                                        Реєстрація
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Основна кнопка */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {loginMethod === 'magic'
                                    ? 'Надіслати посилання'
                                    : authMode === 'signin'
                                        ? 'Увійти'
                                        : 'Зареєструватись'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* ⭐ НОВЕ: Текстова кнопка реєстрації (для Magic Link режиму) */}
                    {loginMethod === 'magic' && authMode === 'signin' && (
                        <TouchableOpacity
                            style={styles.switchModeButton}
                            onPress={() => {
                                setLoginMethod('password');
                                setAuthMode('signup');
                            }}
                            disabled={loading}
                        >
                            <Text style={styles.switchModeText}>
                                Немає облікового запису? <Text style={styles.switchModeTextBold}>Зареєструватись</Text>
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* ⭐ НОВЕ: Текстова кнопка входу (коли в режимі реєстрації) */}
                    {authMode === 'signup' && (
                        <TouchableOpacity
                            style={styles.switchModeButton}
                            onPress={() => setAuthMode('signin')}
                            disabled={loading}
                        >
                            <Text style={styles.switchModeText}>
                                Вже є обліковий запис? <Text style={styles.switchModeTextBold}>Увійти</Text>
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Кнопка пропустити */}
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => navigation.navigate('Home')}
                        disabled={loading}
                    >
                        <Text style={styles.skipButtonText}>Продовжити без входу →</Text>
                    </TouchableOpacity>

                    {/* Інфо текст */}
                    {loginMethod === 'magic' && (
                        <Text style={styles.infoText}>
                            На вашу електронну пошту буде надіслано посилання для входу
                        </Text>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 40,
    },
    logo: {
        fontSize: 80,
        textAlign: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#7F8C8D',
        textAlign: 'center',
        marginBottom: 30,
    },
    methodSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#E1E8ED',
        borderRadius: 10,
        padding: 4,
        marginBottom: 20,
    },
    methodButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    methodButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    methodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7F8C8D',
    },
    methodButtonTextActive: {
        color: '#4A90E2',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    authModeSwitcher: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    authModeText: {
        fontSize: 16,
        color: '#95A5A6',
        paddingHorizontal: 15,
    },
    authModeTextActive: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    authModeSeparator: {
        color: '#E1E8ED',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10, // Зменшено для нової кнопки
    },
    buttonDisabled: {
        backgroundColor: '#95A5A6',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // ⭐ НОВІ СТИЛІ
    switchModeButton: {
        padding: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    switchModeText: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    switchModeTextBold: {
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    skipButton: {
        padding: 15,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        marginTop: 20,
        fontSize: 12,
        color: '#95A5A6',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
