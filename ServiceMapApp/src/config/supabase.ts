import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpubibjvrstparbtqbny.supabase.co'; // вставь свой URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdWJpYmp2cnN0cGFyYnRxYm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjA1NTIsImV4cCI6MjA3OTEzNjU1Mn0.WGSBTpN5_SMT-ELMPZqeLRCzkCym4Dl_W6wV2RAyFhw'; // вставь свой ключ

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});