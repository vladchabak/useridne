export interface Category {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'client' | 'provider' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  category_id: string;
  business_name: string;
  description: string | null;
  photo_url: string | null;
  phone: string;
  whatsapp: string | null;
  telegram: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_approved: boolean;
  is_active: boolean;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface NearbyProvider extends Provider {
  category_name: string;
  category_icon: string;
  distance_km: number;
}

export interface Review {
  id: string;
  provider_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile; 
}
