import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, TextInput, Image, FlatList, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { fetchImage } from '@/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const TOP_PICK_CATEGORIES = CATEGORIES;

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<NASAImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [topPicks, setTopPicks] = useState<NASAImage[]>([]);
  const [favorites, setFavorites] = useState<NASAImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setImages([]);
      setError(null);
      return;
    }
    setLoading(true);
    setImages([]);
    setError(null);

    try {
      await fetchImage(query, (newImage) => {
        setImages(current => [...current, newImage]);
      });
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Unable to fetch images. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

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

  const fetchTopPicks = async () => {
    setLoading(true);
    const allPicks: NASAImage[] = [];

    try {
      for (const category of TOP_PICK_CATEGORIES) {
        let categoryImages: NASAImage[] = [];
        await fetchImage(category, (newImage) => {
          if (categoryImages.length < 3) {
            categoryImages.push(newImage);
            if (categoryImages.length === 3) {
              allPicks.push(...categoryImages);
              if (allPicks.length === TOP_PICK_CATEGORIES.length * 3) {
                setTopPicks(allPicks);
                setLoading(false);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching top picks:', error);
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  useEffect(() => {
    fetchTopPicks();
  }, []);

  useEffect(() => {
    loadFavorites();
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
          }}
          placeholder="Search NASA images..."
          placeholderTextColor="#666"
          returnKeyType="search"
        />
        {searchQuery.trim() !== '' && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setImages([]);
              setError(null);
            }}
            style={styles.clearButton}
          >
            <FontAwesome name="times-circle" size={16} color="#666" />
          </TouchableOpacity>
        )}
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

      <ScrollView style={styles.mainScrollView}>
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : !searchQuery ? (
            <>
              {favorites.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Favorites</Text>
                  <FlatList
                    data={favorites}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.nasa_id}
                    numColumns={2}
                    contentContainerStyle={styles.imageGrid}
                    columnWrapperStyle={styles.row}
                    scrollEnabled={false}
                    nestedScrollEnabled={true}
                  />
                </>
              )}
              <Text style={styles.sectionTitle}>Featured Images</Text>
              <FlatList
                data={topPicks}
                renderItem={renderItem}
                keyExtractor={(item) => item.nasa_id}
                numColumns={2}
                contentContainerStyle={styles.imageGrid}
                columnWrapperStyle={styles.row}
                scrollEnabled={false}
                nestedScrollEnabled={true}
              />
            </>
          ) : images.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No images found</Text>
            </View>
          ) : (
            <FlatList
              data={images}
              renderItem={renderItem}
              keyExtractor={(item) => item.nasa_id}
              numColumns={2}
              contentContainerStyle={styles.imageGrid}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
              nestedScrollEnabled={true}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  contentContainer: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#000',
  },
  mainScrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 8,
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  clearButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
