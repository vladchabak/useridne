import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Modal
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../config/supabase';
import { NearbyProvider, Category } from '../types/database.types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const CYPRUS_CENTER = {
    latitude: 35.1264,
    longitude: 33.4299,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

interface Props {
    navigation: MapScreenNavigationProp;
}

export default function MapScreen({ navigation }: Props) {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [providers, setProviders] = useState<NearbyProvider[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState<Region>(CYPRUS_CENTER);
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        loadCategories();
        requestLocationPermission();
    }, []);

    useEffect(() => {
        if (location) {
            loadNearbyProviders(
                location.coords.latitude,
                location.coords.longitude,
                selectedCategory
            );
        }
    }, [selectedCategory]);

    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            console.error('Помилка завантаження категорій:', error);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Дозвіл відхилено',
                    'Дозвольте доступ до геолокації для пошуку провайдерів поблизу'
                );
                return;
            }

            setLoading(true);
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setLocation(currentLocation);

            const newRegion = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            };

            setRegion(newRegion);

            await loadNearbyProviders(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude,
                selectedCategory
            );
        } catch (error: any) {
            Alert.alert('Помилка', error?.message || 'Не вдалося отримати геолокацію');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadNearbyProviders = async (
        lat: number,
        lng: number,
        categoryId: string | null
    ) => {
        try {
            setLoading(true);

            const { data, error } = await supabase.rpc('nearby_providers', {
                user_lat: lat,
                user_lng: lng,
                radius_km: 10,
                category_filter: categoryId,
            });

            if (error) throw error;

            setProviders(data || []);
        } catch (error: any) {
            Alert.alert('Помилка', error?.message || 'Не вдалося завантажити провайдерів');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setShowFilterModal(false);
    };

    const handleMarkerPress = (provider: NearbyProvider) => {
        navigation.navigate('ProviderDetail', {
            providerId: provider.id,
        });
    };

    const centerOnUserLocation = async () => {
        if (location) {
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            });
        } else {
            await requestLocationPermission();
        }
    };

    const getSelectedCategoryName = () => {
        if (!selectedCategory) return 'Всі категорії';
        const category = categories.find(cat => cat.id === selectedCategory);
        return category ? `${category.icon} ${category.name}` : 'Всі категорії';
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onRegionChangeComplete={setRegion}
            >
                {providers.map((provider) => (
                    <Marker
                        key={provider.id}
                        coordinate={{
                            latitude: provider.latitude || 0,
                            longitude: provider.longitude || 0,
                        }}
                        title={provider.business_name}
                        description={`${provider.category_name} • ${provider.distance_km.toFixed(1)} км`}
                        onPress={() => handleMarkerPress(provider)}
                    >
                        <View style={styles.markerContainer}>
                            <Text style={styles.markerIcon}>{provider.category_icon}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Кнопка фильтрации */}
            <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.filterButtonIcon}>🔍</Text>
                <View style={styles.filterButtonTextContainer}>
                    <Text style={styles.filterButtonLabel}>Фільтр</Text>
                    <Text style={styles.filterButtonValue} numberOfLines={1}>
                        {getSelectedCategoryName()}
                    </Text>
                </View>
                {selectedCategory && (
                    <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>1</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Кнопка центрирования */}
            <TouchableOpacity
                style={styles.centerButton}
                onPress={centerOnUserLocation}
                activeOpacity={0.8}
            >
                <Text style={styles.centerButtonText}>📍</Text>
            </TouchableOpacity>

            {/* Индикатор загрузки */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>Завантаження...</Text>
                </View>
            )}

            {/* Счетчик провайдеров */}
            {!loading && providers.length > 0 && (
                <View style={styles.counterContainer}>
                    <Text style={styles.counterText}>
                        Знайдено провайдерів: {providers.length}
                    </Text>
                </View>
            )}

            {/* Пустой результат */}
            {!loading && providers.length === 0 && location && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>😔</Text>
                    <Text style={styles.emptyTitle}>Немає провайдерів</Text>
                    <Text style={styles.emptySubtitle}>
                        Спробуйте змінити фільтр або збільшити радіус пошуку
                    </Text>
                </View>
            )}

            {/* Модальное окно фильтрации */}
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Оберіть категорію</Text>
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
                            {/* Опция "Все категории" */}
                            <TouchableOpacity
                                style={[
                                    styles.categoryItem,
                                    selectedCategory === null && styles.categoryItemActive
                                ]}
                                onPress={() => handleCategorySelect(null)}
                            >
                                <Text style={styles.categoryItemIcon}>🗂️</Text>
                                <Text style={styles.categoryItemText}>Всі категорії</Text>
                                {selectedCategory === null && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>

                            {/* Список категорий */}
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryItem,
                                        selectedCategory === category.id && styles.categoryItemActive
                                    ]}
                                    onPress={() => handleCategorySelect(category.id)}
                                >
                                    <Text style={styles.categoryItemIcon}>{category.icon}</Text>
                                    <View style={styles.categoryItemInfo}>
                                        <Text style={styles.categoryItemText}>{category.name}</Text>
                                        <Text style={styles.categoryItemSubtext}>{category.name_en}</Text>
                                    </View>
                                    {selectedCategory === category.id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Кнопка сброса */}
                        {selectedCategory && (
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => handleCategorySelect(null)}
                            >
                                <Text style={styles.resetButtonText}>Скинути фільтр</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    markerContainer: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 8,
        borderWidth: 2,
        borderColor: '#4A90E2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerIcon: {
        fontSize: 24,
    },
    filterButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    filterButtonIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    filterButtonTextContainer: {
        flex: 1,
    },
    filterButtonLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 2,
    },
    filterButtonValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    filterBadge: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    centerButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    centerButtonText: {
        fontSize: 30,
    },
    loadingContainer: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#2C3E50',
    },
    counterContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    counterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        position: 'absolute',
        top: '40%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        maxWidth: '80%',
    },
    emptyText: {
        fontSize: 48,
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E8ED',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#7F8C8D',
    },
    categoriesList: {
        maxHeight: 400,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginHorizontal: 15,
        marginVertical: 5,
        borderRadius: 10,
        backgroundColor: '#F5F7FA',
    },
    categoryItemActive: {
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: '#4A90E2',
    },
    categoryItemIcon: {
        fontSize: 32,
        marginRight: 15,
    },
    categoryItemInfo: {
        flex: 1,
    },
    categoryItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 2,
    },
    categoryItemSubtext: {
        fontSize: 13,
        color: '#7F8C8D',
    },
    checkmark: {
        fontSize: 24,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    resetButton: {
        margin: 20,
        marginTop: 10,
        backgroundColor: '#E74C3C',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
