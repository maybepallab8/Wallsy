import { Stack, useLocalSearchParams, router } from 'expo-router';
import { View, StyleSheet, Dimensions, TouchableOpacity, StatusBar, Alert, Platform, Modal, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageScreen() {
  const { id, title, imageUrl, fullImageUrl } = useLocalSearchParams<{
    id: string;
    title: string;
    imageUrl: string;
    fullImageUrl: string;
  }>();
  const [showControls, setShowControls] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Hide status bar when entering the screen
  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  // Request permissions for saving images
  useEffect(() => {
    (async () => {
      await MediaLibrary.requestPermissionsAsync();
    })();
  }, []);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const downloadImage = async () => {
    try {
      const filename = fullImageUrl.split('/').pop() || 'nasa-image.jpg';
      const uri = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(
        fullImageUrl || imageUrl,
        uri
      );
      
      return downloadResult.uri;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(fullImageUrl);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Link Copied', 'Image link copied to clipboard');
      setShowShareSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (Platform.OS === 'android') {
        await Share.share({
          message: fullImageUrl,
          title: 'NASA Image'
        });
      } else {
        // For iOS, use our custom share sheet
        setShowShareSheet(true);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error sharing image URL');
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images');
        return;
      }

      const uri = await downloadImage();
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Image saved to gallery');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error saving image');
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    try {
      Haptics?.impactAsync();
    } catch (error) {
      console.log('Haptics not available');
    }
  };

  // Animation values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Reset position and scale when double tapped
  const resetView = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    positionX.value = withSpring(0);
    positionY.value = withSpring(0);
    savedX.value = 0;
    savedY.value = 0;
  };

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
    });

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      if (scale.value > 1) {
        positionX.value = savedX.value + event.translationX;
        positionY.value = savedY.value + event.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      savedX.value = positionX.value;
      savedY.value = positionY.value;
    });

  // Double tap gesture
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      'worklet';
      resetView();
    });

  // Combine gestures
  const composed = Gesture.Simultaneous(
    Gesture.Race(pinchGesture, doubleTapGesture),
    panGesture
  );

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value },
      { translateY: positionY.value },
      { scale: scale.value },
    ],
  }));

  const ShareSheet = () => (
    Platform.OS === 'ios' ? (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showShareSheet}
        onRequestClose={() => setShowShareSheet(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowShareSheet(false)}
        >
          <Pressable style={styles.shareSheet}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share Image</Text>
              <View style={styles.indicator} />
            </View>

            <View style={styles.shareOptions}>
              <TouchableOpacity 
                style={styles.shareOption} 
                onPress={async () => {
                  try {
                    await Share.share({
                      message: fullImageUrl
                    });
                    setShowShareSheet(false);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to share URL');
                  }
                }}
              >
                <View style={[styles.shareIconBg, { backgroundColor: '#25D366' }]}>
                  <FontAwesome name="whatsapp" size={22} color="white" />
                </View>
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareOption}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: fullImageUrl
                    });
                    setShowShareSheet(false);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to share URL');
                  }
                }}
              >
                <View style={[styles.shareIconBg, { backgroundColor: '#0088CC' }]}>
                  <FontAwesome name="telegram" size={22} color="white" />
                </View>
                <Text style={styles.shareOptionText}>Telegram</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareOption}
                onPress={copyLink}
              >
                <View style={[styles.shareIconBg, { backgroundColor: '#8E8E93' }]}>
                  <FontAwesome name="link" size={22} color="white" />
                </View>
                <Text style={styles.shareOptionText}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.moreButton}
              onPress={async () => {
                try {
                  await Share.share({
                    message: fullImageUrl
                  });
                  setShowShareSheet(false);
                } catch (error) {
                  Alert.alert('Error', 'Failed to share URL');
                }
              }}
            >
              <Text style={styles.moreButtonText}>More Options</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    ) : null
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.content, { backgroundColor: '#000' }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={toggleControls}
          activeOpacity={1}
        />

        <GestureDetector gesture={composed}>
          <Animated.Image
            source={{ uri: fullImageUrl || imageUrl }}
            style={[styles.fullImage, animatedStyle]}
            resizeMode="contain"
          />
        </GestureDetector>

        {showControls && (
          <>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.topBar, { left: 20, right: undefined, width: 40 }]}
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleFavorite} 
              style={[styles.topBar, { right: 20, left: undefined, width: 40 }]}
            >
              <FontAwesome 
                name={isFavorite ? "heart" : "heart-o"} 
                size={20} 
                color={isFavorite ? "#ff3b30" : "white"} 
              />
            </TouchableOpacity>

            <View style={styles.bottomInfo} pointerEvents="box-none">
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleSave}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonInner}>
                    <FontAwesome name="download" size={20} color="white" />
                    <Text style={styles.actionText}>Save</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonInner}>
                    <FontAwesome name="share" size={20} color="white" />
                    <Text style={styles.actionText}>Share</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleFavorite}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonInner}>
                    <FontAwesome name="info-circle" size={20} color="white" />
                    <Text style={styles.actionText}>Info</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
      <ShareSheet />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(10px)',
    zIndex: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 15,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 80,
  },
  actionButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    paddingBottom: 40,
  },
  shareHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    marginTop: 10,
  },
  shareTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  shareOption: {
    alignItems: 'center',
    width: 80,
  },
  shareIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    color: 'white',
    fontSize: 12,
  },
  moreButton: {
    backgroundColor: '#3A3A3C',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  moreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 