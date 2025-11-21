import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../config/supabase';
import { NearbyProvider } from '../types/database.types';
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
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState<Region>(CYPRUS_CENTER);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        requestLocationPermission();
    }, []);

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
                currentLocation.coords.longitude
            );
        } catch (error: any) {
            Alert.alert('Помилка', error?.message || 'Не вдалося отримати геолокацію');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadNearbyProviders = async (lat: number, lng: number, categoryId?: string) => {
        try {
            setLoading(true);

            const { data, error } = await supabase.rpc('nearby_providers', {
                user_lat: lat,
                user_lng: lng,
                radius_km: 10,
                category_filter: categoryId || null,
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

            {/* Кнопка центрирования на пользователе */}
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
        top: 20,
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
});
