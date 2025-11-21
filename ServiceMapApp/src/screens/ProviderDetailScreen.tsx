import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../config/supabase';
import { Provider } from '../types/database.types';

type ProviderDetailRouteProp = RouteProp<RootStackParamList, 'ProviderDetail'>;

interface Props {
    route: ProviderDetailRouteProp;
}

export default function ProviderDetailScreen({ route }: Props) {
    const { providerId } = route.params;
    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProvider();
    }, [providerId]);

    const loadProvider = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('id', providerId)
                .single();

            if (error) throw error;

            setProvider(data);
        } catch (error: any) {
            Alert.alert('Помилка', error?.message || 'Не вдалося завантажити деталі провайдера');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone: string) => {
        Linking.openURL(`whatsapp://send?phone=${phone}`);
    };

    const handleTelegram = (username: string) => {
        Linking.openURL(`tg://resolve?domain=${username}`);
    };

    if (loading || !provider) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Завантаження...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.businessName}>{provider.business_name}</Text>
            </View>

            {provider.description && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Опис</Text>
                    <Text style={styles.description}>{provider.description}</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Контакти</Text>

                <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleCall(provider.phone)}
                >
                    <Text style={styles.contactIcon}>📞</Text>
                    <Text style={styles.contactText}>{provider.phone}</Text>
                </TouchableOpacity>

                {provider.whatsapp && (
                    <TouchableOpacity
                        style={[styles.contactButton, styles.whatsappButton]}
                        onPress={() => handleWhatsApp(provider.whatsapp!)}
                    >
                        <Text style={styles.contactIcon}>💬</Text>
                        <Text style={styles.contactText}>WhatsApp</Text>
                    </TouchableOpacity>
                )}

                {provider.telegram && (
                    <TouchableOpacity
                        style={[styles.contactButton, styles.telegramButton]}
                        onPress={() => handleTelegram(provider.telegram!)}
                    >
                        <Text style={styles.contactIcon}>✈️</Text>
                        <Text style={styles.contactText}>Telegram</Text>
                    </TouchableOpacity>
                )}
            </View>

            {provider.address && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Адреса</Text>
                    <Text style={styles.address}>📍 {provider.address}</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#7F8C8D',
    },
    header: {
        backgroundColor: '#4A90E2',
        padding: 20,
    },
    businessName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 15,
    },
    description: {
        fontSize: 15,
        color: '#7F8C8D',
        lineHeight: 22,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    whatsappButton: {
        backgroundColor: '#E8F5E9',
    },
    telegramButton: {
        backgroundColor: '#E3F2FD',
    },
    contactIcon: {
        fontSize: 24,
        marginRight: 15,
    },
    contactText: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '600',
    },
    address: {
        fontSize: 15,
        color: '#7F8C8D',
    },
});
