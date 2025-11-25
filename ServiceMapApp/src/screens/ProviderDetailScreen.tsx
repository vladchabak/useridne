import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../config/supabase';
import { Provider, Review } from '../types/database.types';
import { Rating } from 'react-native-ratings'; // Добавим библиотеку для рейтинга
import { useAuth } from '../contexts/AuthContext';

type ProviderDetailRouteProp = RouteProp<RootStackParamList, 'ProviderDetail'>;

interface Props {
  route: ProviderDetailRouteProp;
}

export default function ProviderDetailScreen({ route }: Props) {
  const { providerId } = route.params;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const { user, session } = useAuth();

  useEffect(() => {
    loadProvider();
    loadReviews();
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

  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profile:user_id (full_name, avatar_url)')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error: any) {
      Alert.alert('Помилка', error?.message || 'Не вдалося завантажити відгуки');
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

  const submitReview = async () => {
    if (!session || !user) {
      Alert.alert('Помилка', 'Необхідно увійти, щоб залишити відгук');
      return;
    }

    if (!newRating) {
      Alert.alert('Помилка', 'Будь ласка, поставте оцінку');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            provider_id: providerId,
            user_id: user.id,
            rating: newRating,
            comment: newComment,
          },
        ])
        .single();

      if (error) throw error;

      // Очистить форму
      setNewRating(null);
      setNewComment('');

      // Обновить список отзывов
      loadReviews();

      Alert.alert('Успіх', 'Відгук успішно додано');
    } catch (error: any) {
      Alert.alert('Помилка', error?.message || 'Не вдалося залишити відгук');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

        {/* Секция отзывов */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Відгуки</Text>

          {/* Форма добавления отзыва */}
          <View style={styles.reviewForm}>
            <Text style={styles.formTitle}>Залишити відгук</Text>

            <Rating
              startingValue={newRating || 0}
              onFinishRating={(rating) => setNewRating(rating)}
              style={styles.rating}
            />

            <TextInput
              style={styles.commentInput}
              placeholder="Ваш коментар..."
              value={newComment}
              onChangeText={setNewComment}
              multiline={true}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitReview}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Відправка...' : 'Відправити відгук'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Список отзывов */}
          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Ще немає відгуків</Text>
          ) : (
            reviews.map((review) => (
              <View style={styles.reviewItem} key={review.id}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>
                    {review.profile?.full_name || 'Анонім'}
                  </Text>
                  <Rating
                    startingValue={review.rating}
                    readonly={true}
                    imageSize={16}
                    style={styles.reviewRating}
                  />
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
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
  reviewForm: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  rating: {
    marginBottom: 10,
  },
  commentInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 15,
    color: '#2C3E50',
    minHeight: 80,
    textAlignVertical: 'top', // Для Android
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  reviewRating: {
    alignItems: 'flex-start',
  },
  reviewComment: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  reviewDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  noReviewsText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
});
