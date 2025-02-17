/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ProgressBarAndroid, TouchableOpacity, ScrollView, Image, Linking, Alert, Platform, Modal, Animated,
  PanResponder, Pressable,
  Easing
 } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import RNFS from 'react-native-fs'; 
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImageViewing from 'react-native-image-viewing';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styles from './src/styles/styles';

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // Handling Android 13+ specific media permissions
      if (Platform.Version >= 33) {
        const imagePermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        const videoPermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);

        console.log('Storage permission for Android 13+:', imagePermission, videoPermission);

        if (imagePermission === RESULTS.GRANTED || videoPermission === RESULTS.GRANTED) {
          console.log('Storage permission granted for Android 13+.');
          return true;
        } else {
          console.log('Storage permission denied for Android 13+.');
          Alert.alert(
            'Permission Required',
            'Storage permission has been denied. Please enable it manually from the app settings.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return false;
        }
      } else {
        // Fallback for Android 12 and below
        const granted = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

        if (granted === RESULTS.GRANTED) {
          console.log('Storage permission granted for Android 12 and below.');
          return true;
        } else {
          console.log('Storage permission denied for Android 12 and below.');
          Alert.alert(
            'Permission Required',
            'Storage permission has been denied. Please enable it manually from the app settings.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return false;
        }
      }
    } catch (err) {
      console.warn('Permission request failed:', err);
      return false;
    }
  } else {
    console.log('Storage permission is not required on this platform.');
    return true;
  }
};

// Type definitions for navigation and routes
type RootStackParamList = {
  HomeScreen: undefined;
  CategoryScreen: { title: string };
};

// Define navigation props for screens
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;

// BlankScreen renamed to CategoryScreen
interface CategoryScreenProps extends StackScreenProps<RootStackParamList, 'CategoryScreen'> {}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ route }) => {
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ size: string; lastModified: string; fileName: string; filePath: string; dimensions: string } | null>(null);
  const scrollOffset = useRef(0);
  const pan = useRef(new Animated.ValueXY()).current; // For drag gesture tracking
  const [dragged, setDragged] = useState(false); // To track whether dragging is happening
  // Add these to your existing state/refs
  const modalHeight = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  const isScrolling = useRef(false);
  const lastScrollY = useRef(0);


  useEffect(() => {
    const loadImages = async () => {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) return;

      const result: { name: string; path: string }[] = [];
      const traverseFolder = async (folderPath: string) => {
        try {
          const folderContents = await RNFS.readDir(folderPath);
          for (const item of folderContents) {
            if (item.isFile()) {
              const lowerName = item.name.toLowerCase();
              if (
                lowerName.endsWith('.jpg') ||
                lowerName.endsWith('.jpeg') ||
                lowerName.endsWith('.png') ||
                lowerName.endsWith('.gif') ||
                lowerName.endsWith('.bmp') ||
                lowerName.endsWith('.webp')
              ) {
                result.push({ name: item.name, path: item.path });
              }
            } else if (item.isDirectory()) {
              await traverseFolder(item.path);
            }
          }
        } catch (err) {
          console.log(`Error reading folder ${folderPath}:`, err);
        }
      };

      try {
        // await traverseFolder(RNFS.DownloadDirectoryPath);  // downlaoded images loaded
        // await traverseFolder(RNFS.ExternalDirectoryPath);
        // await traverseFolder(RNFS.PicturesDirectoryPath);  // Camera images loaded
        // await traverseFolder(RNFS.DocumentDirectoryPath);
        await traverseFolder(RNFS.ExternalStorageDirectoryPath); // All images loaded downlaoded, camera, pictures
        setFiles(result);
      } catch (err) {
        console.log('Error traversing directories:', err);
      }
    };

    if (route.params.title === 'Photos') {
      loadImages();
    }
  }, [route.params.title]);

  const openImageViewer = (imageUri: string, imageName: string) => {
    setSelectedImage(imageUri);
    setSelectedImageName(imageName)
    setImageViewerVisible(true);
  };

  // Reset pan value when modal opens
  useEffect(() => {
    if (isDetailsVisible) {
      pan.setValue({ x: 0, y: 0 });
      // setDragged(false);
    }
  }, [isDetailsVisible]);

  // First, create a function to handle the closing animation
  const closeModal = () => {

     // First set a flag or state to prevent re-renders during animation
     setDetailsVisible(false);  // Set this first to prevent re-renders

     // Reset all animation values immediately
     modalTranslateY.setValue(0);
     modalHeight.setValue(1);
 
     // Clear the file details
     setFileDetails(null);

    // Animate the modal out
    // Animated.parallel([
    //   Animated.timing(modalTranslateY, {
    //     toValue: 400, // Animate downward
    //     duration: 300,
    //     useNativeDriver: true,
    //   }),
    //   Animated.timing(modalHeight, {
    //     toValue: 0,
    //     duration: 300,
    //     useNativeDriver: true,
    //   }),
    // ]).start(() => {
    //   // Only reset states after animation completes
    //   modalTranslateY.setValue(0);
    //   modalHeight.setValue(1);
    //   setDetailsVisible(false);
    //   setFileDetails(null);
    // });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationY } = evt.nativeEvent;
        // Only respond to touches in the drag handle area
        return locationY < 60;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { locationY } = evt.nativeEvent;
        const isDraggingDown = gestureState.dy > 0;
        const isSignificantDrag = Math.abs(gestureState.dy) > 5;
        const isInDragArea = locationY < 60;
        
        // If we're actively scrolling, don't intercept
        if (isScrolling.current && !isInDragArea) {
          return false;
        }
  
        // Allow drag if:
        // 1. Touch started in drag handle area
        // 2. OR we're at the top of scroll AND dragging down
        return (
          isInDragArea ||
          (scrollOffset.current <= 0 && isDraggingDown && isSignificantDrag)
        );
      },
      onPanResponderGrant: () => {
        isScrolling.current = false;
        lastScrollY.current = scrollOffset.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow downward drag when at the top of the scroll
          if (scrollOffset.current <= 0) {
            modalTranslateY.setValue(gestureState.dy);
            const opacity = Math.max(0.5, 1 - (gestureState.dy / 400));
            modalHeight.setValue(opacity);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 && !isScrolling.current) {
          closeModal();
        } else {
          // Spring back animation
          Animated.parallel([
            Animated.spring(modalTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 8,
              speed: 12,
            }),
            Animated.timing(modalHeight, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
        isScrolling.current = false;
      },
      // onPanResponderTerminate: () => {
      //   isScrolling.current = false;
      // },
    })
  ).current;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.fileList}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled" // Handles taps outside
      showsVerticalScrollIndicator={true} // Show scroll indicator
      >
        {files.length > 0 ? (
          files.map((file, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fileItem}
              onPress={() => openImageViewer(`file://${file.path}`, file.name)} // Show image in viewer
            >
              <Image source={{ uri: `file://${file.path}` }} style={styles.imageIcon} />
              <Text style={styles.fileName}>{file.name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noFiles}>No {route.params.title} found</Text>
        )}
      </ScrollView>

      {files.length > 0 && selectedImage !== null && (
        <ImageViewing
          images={files.map((file) => ({ uri: `file://${file.path}` }))}
          imageIndex={files.findIndex((file) => `file://${file.path}` === selectedImage)}
          visible={isImageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
          HeaderComponent={({ imageIndex }) => {
            // Dynamically update image details using imageIndex
            const currentFile = files[imageIndex];

            return (
              <View style={styles.imageViewerHeader}>
                <View style={styles.detailsIconContainer}>
                  <TouchableOpacity
                    onPress={async () => {
                      const filePath = currentFile.path.replace('file://', '');
                      const stats = await RNFS.stat(filePath);
                      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                      const lastModifiedDate = new Date(stats.mtime);
                      const fileName = currentFile.name;
                      // Format the date and time
                      const day = lastModifiedDate.getDate().toString().padStart(2, '0');
                      const month = (lastModifiedDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
                      const year = lastModifiedDate.getFullYear();
                      const minutes = lastModifiedDate.getMinutes().toString().padStart(2, '0');
                      const seconds = lastModifiedDate.getSeconds().toString().padStart(2, '0');
                      const ampm = lastModifiedDate.getHours() >= 12 ? 'PM' : 'AM';

                      // Convert 24-hour time to 12-hour time
                      let hours12 = lastModifiedDate.getHours() % 12;
                      hours12 = hours12 ? hours12 : 12; // the hour '0' should be '12'

                      const lastModified = `${day}/${month}/${year} ${hours12}:${minutes}:${seconds} ${ampm}`;
                      
                      const dimensions = await Image.getSize(`file://${filePath}`)

                      modalTranslateY.setValue(0);
                      modalHeight.setValue(1);

                      setFileDetails({ size: sizeInMB, lastModified, fileName, filePath,
                        dimensions: `${dimensions.width} × ${dimensions.height} Pixels`,
                       });
                      setDetailsVisible(true);
                    }}
                  >
                    <Icon name="info-circle" size={30} color="white" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.imageTitleName}>{currentFile?.name}</Text>

                {/* Close Button in Modal */}
                <TouchableOpacity
                  style={styles.closeIconContainer}
                  onPress={() => setImageViewerVisible(false)}
                >
                  <Icon name="close" size={30} color="white" />
                </TouchableOpacity>
              </View>
            );

          }}
          FooterComponent={({ imageIndex }) => {
            const totalImages = files.length; // Total images count
            return (
              <View style={styles.imageViewerFooter}>
                <Text style={styles.imageIndexFooter}>
                  {imageIndex + 1} / {totalImages}
                </Text>
              </View>
            );
          }}
        />
      )}

     
      <Modal
        visible={isDetailsVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}>
          <Animated.View 
            style={[
              styles.detailsContent,
              {
                transform: [{ translateY: modalTranslateY }],
                opacity: modalHeight,
              }
            ]}
            {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={
                  closeModal
                }>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Details</Text>
              <View style={styles.placeholder} />
            </View>
            <ScrollView 
              style={styles.scrollableContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={true}
              bounces={true}
              onScrollBeginDrag={() => {
                isScrolling.current = true;
              }}
              onScrollEndDrag={() => {
                isScrolling.current = false;
              }}
              onScroll={(e) => {
                scrollOffset.current = e.nativeEvent.contentOffset.y;
                lastScrollY.current = scrollOffset.current;
              }}
              scrollEventThrottle={16}>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Name</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.fileName}</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Time</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.lastModified}</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Dimensions</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.dimensions}</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Size</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.size} MB</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Path</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.filePath}</Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );

};


interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const usedSpace = 62.17;
  const totalSpace = 256;
  const progress = usedSpace / totalSpace;

  const [categories, setCategories] = useState([
    { name: 'Photos', icon: 'image', count: 'Loading...' },
    { name: 'Videos', icon: 'video-camera', count: '350' }, // Static for now
    { name: 'Audio', icon: 'music', count: '850' }, // Static for now
    { name: 'Documents', icon: 'file-text', count: '420' }, // Static for now
    { name: 'APKs', icon: 'android', count: '98' }, // Static for now
    { name: 'Archives', icon: 'archive', count: '76' }, // Static for now
  ]);

  const countImageFiles = async () => {
    try {
      const directoryPath = RNFS.ExternalStorageDirectoryPath;
  
      // Validate if the path exists
      const pathExists = await RNFS.exists(directoryPath);
      if (!pathExists) {
        console.error(`Directory does not exist: ${directoryPath}`);
        return;
      }
  
      // Recursive function to count image files
      const getImageFileCount = async (path: string): Promise<number> => {
        try {
          const files = await RNFS.readDir(path);
          if (!files || files.length === 0) return 0;
  
          let count = 0;
  
          for (const file of files) {
            if (file.isFile() && /\.(jpg|png|jpeg|gif|bmp|webp)$/i.test(file.name)) {
              count++;
            } else if (file.isDirectory()) {
              count += await getImageFileCount(file.path); // Recurse into subdirectories
            }
          }
          return count;
        } catch (error) {
          console.error(`Failed to read directory: ${path}`, error);
          return 0;
        }
      };
  
      const imageCount = await getImageFileCount(directoryPath);
  
      // Update the Photos category count
      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.name === 'Photos' ? { ...category, count: imageCount.toString() } : category
        )
      );
    } catch (error) {
      console.error('Error counting image files:', error);
    }
  };

  // Fetch image count on component mount
  useEffect(() => {
    countImageFiles();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Files</Text>

      <View style={styles.searchBarContainer}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          placeholderTextColor="#888"
        />
      </View>

      {/* Device storage display */}
      <View style={styles.storageBox}>
        <Text style={styles.storageTitle}>Device Storage SWEEKAR</Text>
        <View style={styles.storageDetails}>
          <Text style={styles.storageUsed}>{usedSpace} GB</Text>
          <Text style={styles.storageTotal}>{totalSpace} GB</Text>
        </View>
        <ProgressBarAndroid
          styleAttr="Horizontal"
          color="green"
          indeterminate={false}
          progress={progress}
          style={styles.progressBar}
        />
      </View>

      {/* Category Boxes */}
      <View style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <TouchableOpacity
            style={styles.categoryBox}
            key={index}
            onPress={() => navigation.navigate('CategoryScreen', { title: category.name })} // Rename route to CategoryScreen
          >
            <Icon name={category.icon} size={30} color="#666" />
            <Text style={styles.categoryText}>{category.name}</Text>
            <Text style={styles.categoryCount}>{category.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Create Stack Navigator
const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'File Manager' }} />
            <Stack.Screen name="CategoryScreen" component={CategoryScreen} options={({ route }) => ({ title: route.params.title })} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;