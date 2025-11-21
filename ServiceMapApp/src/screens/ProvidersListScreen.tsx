import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../config/supabase';
import { Provider } from '../types/database.types';

type ProvidersListNavigationProp = StackNavigationProp<RootStackParamList, 'ProvidersList'>;
type ProvidersListRouteProp = RouteProp<RootStackParamList, 'ProvidersList'>;

interface Props {
    navigation: ProvidersListNavigationProp;
    route: ProvidersListRouteProp;
}

export default function ProvidersListScreen({ navigation, route }: Props) {
    const { categoryId, categoryName } = route.params;
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProviders();
    }, [categoryId]);

    const loadProviders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('category_id', categoryId)
                .eq('is_approved', true)
                .eq('is_active', true)
                .order('business_name');

            if (error) throw error;

            setProviders(data || []);
        } catch (error: any) {
            Alert.alert('Помилка', error?.message || 'Не вдалося завантажити провайдерів');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderPress = (provider: Provider) => {
        navigation.navigate('ProviderDetail', {
            providerId: provider.id,
        });
    };

    const renderProvider = ({ item }: { item: Provider }) => (
        <TouchableOpacity
            style={styles.providerCard}
            onPress={() => handleProviderPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.providerInfo}>
                <Text style={styles.businessName}>{item.business_name}</Text>
                {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <View style={styles.contactRow}>
                    <Text style={styles.phone}>📞 {item.phone}</Text>
                    {item.whatsapp && <Text style={styles.badge}>WhatsApp</Text>}
                    {item.telegram && <Text style={styles.badge}>Telegram</Text>}
                </View>
                {item.address && (
                    <Text style={styles.address}>📍 {item.address}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Завантаження провайдерів...</Text>
            </View>
        );
    }

    if (providers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>😔</Text>
                <Text style={styles.emptyTitle}>Немає провайдерів</Text>
                <Text style={styles.emptySubtitle}>
                    У цій категорії поки що немає зареєстрованих провайдерів
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.categoryTitle}>{categoryName}</Text>
                <Text style={styles.count}>Знайдено: {providers.length}</Text>
            </View>

            <FlatList
                data={providers}
                renderItem={renderProvider}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
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
        padding: 20,
    },
    header: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E8ED',
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
    },
    count: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#7F8C8D',
    },
    emptyText: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        textAlign: 'center',
    },
    listContainer: {
        padding: 15,
    },
    providerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    providerInfo: {
        flex: 1,
    },
    businessName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 10,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    phone: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '600',
        marginRight: 10,
    },
    badge: {
        backgroundColor: '#E8F5E9',
        color: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
        marginRight: 6,
    },
    address: {
        fontSize: 13,
        color: '#95A5A6',
    },
});
