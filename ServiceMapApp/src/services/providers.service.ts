import { supabase } from '../config/supabase';
import { NearbyProvider, Provider } from '../types/database.types';

export const providersService = {
    async getNearbyProviders(
        lat: number,
        lng: number,
        radiusKm: number = 10,
        categoryId?: string
    ): Promise<NearbyProvider[]> {
        const { data, error } = await supabase.rpc('nearby_providers', {
            user_lat: lat,
            user_lng: lng,
            radius_km: radiusKm,
            category_filter: categoryId || null,
        });

        if (error) throw error;
        return data || [];
    },

    async getProviderById(providerId: string): Promise<Provider | null> {
        const { data, error } = await supabase
            .from('providers')
            .select('*')
            .eq('id', providerId)
            .single();

        if (error) throw error;
        return data;
    },

    async getProvidersByCategory(categoryId: string): Promise<Provider[]> {
        const { data, error } = await supabase
            .from('providers')
            .select('*')
            .eq('category_id', categoryId)
            .eq('is_approved', true)
            .eq('is_active', true)
            .order('business_name');

        if (error) throw error;
        return data || [];
    }
};
