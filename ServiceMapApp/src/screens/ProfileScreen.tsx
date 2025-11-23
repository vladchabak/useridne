import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Profile } from '../types/database.types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { session, user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !user) {
      navigation.navigate('Login');
      return;
    }
    loadProfile();
  }, [session, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error: any) {
      Alert.alert('Помилка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);

      const updates = {
        id: user!.id,
        email: user!.email,
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
        user_type: profile?.user_type || 'client',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      Alert.alert('Успіх', 'Профіль оновлено');
      loadProfile();
    } catch (error: any) {
      Alert.alert('Помилка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Помилка', 'Необхідно надати дозвіл на доступ до галереї');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const fileExt = uri.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      Alert.alert('Успіх', 'Фото завантажено');
    } catch (error: any) {
      Alert.alert('Помилка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Вихід',
      'Ви впевнені, що хочете вийти?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Вийти',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  if (!session || !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedText}>Ви не увійшли в систему</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Увійти</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Завантаження профілю...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Мій профіль</Text>

        {/* Аватар */}
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>📷</Text>
            </View>
          )}
          <Text style={styles.changePhotoText}>Змінити фото</Text>
        </TouchableOpacity>

        {/* Email (только чтение) */}
        <View style={styles.field}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.valueText}>{user.email}</Text>
        </View>

        {/* Полное имя */}
        <View style={styles.field}>
          <Text style={styles.label}>Повне ім'я:</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Введіть ваше ім'я"
            editable={!loading}
          />
        </View>

        {/* Телефон */}
        <View style={styles.field}>
          <Text style={styles.label}>Телефон:</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+357 XX XXX XXX"
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Тип пользователя */}
        <View style={styles.field}>
          <Text style={styles.label}>Тип облікового запису:</Text>
          <Text style={styles.userType}>
            {profile?.user_type === 'provider' ? '🏢 Провайдер' : '👤 Клієнт'}
          </Text>
        </View>

        {/* Кнопка сохранения */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={updateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Зберегти зміни</Text>
          )}
        </TouchableOpacity>

        {/* Кнопка выхода */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.signOutButtonText}>Вийти з облікового запису</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 30,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E1E8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarPlaceholderText: {
    fontSize: 40,
  },
  changePhotoText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 16,
    color: '#7F8C8D',
    padding: 15,
    backgroundColor: '#E1E8ED',
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  userType: {
    fontSize: 16,
    color: '#2C3E50',
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
  notLoggedText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 20,
  },
});
