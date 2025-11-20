import { supabase } from '../config/supabase';
import { NearbyProvider, Category } from '../types/database.types';

export const providersService = {
  // Получить категории
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Поиск провайдеров рядом
  async getNearbyProviders(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    categoryId?: string
  ): Promise<NearbyProvider[]> {
    const { data, error } = await supabase.rpc('nearby_providers', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
      category_filter: categoryId || null,
    });

    if (error) throw error;
    return data || [];
  },

  // Получить провайдера по ID
  async getProviderById(id: string) {
    const { data, error } = await supabase
      .from('providers')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Создать провайдера
  async createProvider(providerData: any) {
    const { data, error } = await supabase
      .from('providers')
      .insert(providerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};