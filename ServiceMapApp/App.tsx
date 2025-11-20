import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { useState } from 'react';
import { supabase } from './src/config/supabase';

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setCategories(data || []);
      Alert.alert('Успіх!', `Завантажено ${data?.length || 0} категорій`);
    } catch (error: any) {
      Alert.alert('Помилка', error?.message || 'Невідома помилка');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ServiceMap Cyprus 🇨🇾</Text>
      <Text style={styles.subtitle}>
        Категорій: {categories.length}
      </Text>
      
      {categories.map((cat) => (
        <Text key={cat.id} style={styles.category}>
          {cat.icon} {cat.name}
        </Text>
      ))}

      <Button 
        title={loading ? "Завантаження..." : "Завантажити категорії"} 
        onPress={loadCategories}
        disabled={loading}
      />
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  category: {
    fontSize: 18,
    marginVertical: 5,
  },
});