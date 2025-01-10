import { Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, TextInput, Image, FlatList, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { fetchImage } from '@/api';

interface NASAImage {
  title: string;
  description: string;
  nasa_id: string;
  dateCreated: string;
  thumbnailUrl: string;
  fullImageUrl: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_WIDTH = SCREEN_WIDTH / 2 - 15; // 15px total margin between columns

const CATEGORIES = [
  'Earth', 'Space', 'Mars', 'NASA', 'Galaxy', 'Jupiter', 'Asteroid'
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<NASAImage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setImages([]);
    
    try {
      await fetchImage(query, (newImage) => {
        setImages(current => [...current, newImage]);
      });
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: string) => {
    setSearchQuery(category);
    handleSearch(category);
  };

  const renderItem = ({ item }: { item: NASAImage }) => {
    return (
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => {
          router.push({
            pathname: `/image/${item.nasa_id}`,
            params: { 
              title: item.title,
              imageUrl: item.thumbnailUrl,
              fullImageUrl: item.fullImageUrl
            }
          });
        }}
      >
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Wallsy",
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
        }}
      />
      
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search NASA images..."
          placeholderTextColor="#666"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity 
              key={category}
              style={[
                styles.categoryButton,
                searchQuery === category && styles.categoryButtonActive
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={[
                styles.categoryText,
                searchQuery === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        <FlatList
          data={loading ? [] : images}
          renderItem={renderItem}
          keyExtractor={(item) => item.nasa_id}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={null}
        />
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
        
        {!loading && images.length === 0 && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.emptyText}>No images found</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    paddingHorizontal: 15,
    height: 45,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesWrapper: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  categoriesContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eaeaea',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  categoryTextActive: {
    color: '#fff',
  },
  imageGrid: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: SCREEN_WIDTH / 2 - 12,
    height: (SCREEN_WIDTH / 2 - 12) * 2,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
});
