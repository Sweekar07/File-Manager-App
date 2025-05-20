// src/components/CategoryScreen.tsx

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, Pressable, ScrollView, Modal, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';
import styles from '../styles/styles';
import { checkPermissions } from '../utils/permissions';
import ImageViewerModal from './ImageViewerModal';
import AudioPlayerModal from './AudioPlayerModal';
import VideoPlayerModal from './VideoPlayerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageView from 'react-native-image-viewing';
import BottomsheetModal from './BottomSheet';
import { OrientationLocker } from 'react-native-orientation-locker';
import DocumentViewer from './DocumentModule/DocumentViewer';

interface File {
  name: string;
  path: string;
  type: 'image' | 'audio' | 'video' | 'document' | 'apk' | 'archive';
}

interface Folder {
  name: string;
  path: string;
  fileCount?: number;
}

interface CategoryScreenProps {
  route: {
    params: {
      title: 'Photos' | 'Audio' | 'Videos' | 'Documents' | 'APKs' | 'Archives';
    };
  };
  navigation: any;
}

// Constants
// const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_EXPIRATION_TIME = 30 * 1000; // 24 hours
const MAX_FILES = 1000;
const SCAN_DEPTH_LIMIT = 100;
const BASE_DIRECTORIES = {
  'Photos': [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/DCIM`,
    `${RNFS.ExternalStorageDirectoryPath}/Pictures`,
    `${RNFS.ExternalStorageDirectoryPath}/Download`
  ],
  'Audio': [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/Music`,
    `${RNFS.ExternalStorageDirectoryPath}/Download`,
    `${RNFS.ExternalStorageDirectoryPath}/Audio`
  ],
  'Videos': [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/Movies`,
    `${RNFS.ExternalStorageDirectoryPath}/DCIM`,
    `${RNFS.ExternalStorageDirectoryPath}/Download`,
    `${RNFS.ExternalStorageDirectoryPath}/Videos`
  ],
  'Documents': [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/Download`,
    `${RNFS.ExternalStorageDirectoryPath}/Documents`
  ],
  'APKs': [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/Download`
  ],
  'Archives': [
    RNFS.ExternalStorageDirectoryPath,
    `${RNFS.ExternalStorageDirectoryPath}/Download`
  ]
};

const SKIP_DIRECTORIES = ['Android', '.', '..', 'Android/data', '.thumbnails', '.Trash', '$RECYCLE.BIN'];


const CategoryScreen: React.FC<CategoryScreenProps> = ({ route, navigation }) => {

  // State variables
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [fileType, setFileType] = useState<File['type'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // New state for image viewing
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [imageFileDetails, setImageFileDetails] = useState<{
    size: string;
    lastModified: string;
    fileName: string;
    filePath: string;
    dimensions: string;
  } | null>(null);
  const [audioFileDetails, setAudioFileDetails] = useState<{
    size: string,
    modifiedDate: string;
  } | null>(null)

  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);

  const [documentFile, setDocumentFile] = useState<{ path: string , name: string} | null>(null);

  // Memoized file type and category matching functions
  const getFileType = useCallback((fileName: string): File['type'] => {
    const lowerName = fileName.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lowerName)) return 'image';
    if (/\.(mp3|wav|aac|flac)$/i.test(lowerName)) return 'audio';
    if (/\.(mp4|mkv|avi)$/i.test(lowerName)) return 'video';
    if (/\.(pdf|doc|docx|txt|rtf|html)$/i.test(lowerName)) return 'document';
    if (/\.apk$/i.test(lowerName)) return 'apk';
    if (/\.(zip|rar|7z|tar|gz)$/i.test(lowerName)) return 'archive';
    return 'document';
  }, []);

  const isFileMatchingCategory = useCallback((fileName: string, category: string): boolean => {
    const lowerName = fileName.toLowerCase();
    switch (category) {
      case 'Photos': return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lowerName);
      case 'Audio': return /\.(mp3|wav|aac|flac)$/i.test(lowerName);
      case 'Videos': return /\.(mp4|mkv|avi)$/i.test(lowerName);
      case 'Documents': return /\.(pdf|doc|docx|txt|html)$/i.test(lowerName);
      case 'APKs': return /\.apk$/i.test(lowerName);
      case 'Archives': return /\.(zip|rar|7z|tar|gz)$/i.test(lowerName);
      default: return false;
    }
  }, []);

  // Cache management functions
  const getCachedData = async (key: string) => {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error retrieving cached data:', error);
    }
    return null;
  };

  const setCachedData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  // Optimized folder discovery with memoization and reduced recursion
  const discoverFolders = useCallback(async () => {

    const { title } = route.params;
    const cacheKey = `${title}_folders`;

    // Clear cache to ensure fresh data for different categories
    await AsyncStorage.removeItem(cacheKey);

    // Check cached folders first
    const cachedFolders = await getCachedData(cacheKey);
    if (cachedFolders) {
      setFolders(cachedFolders);
      setLoading(false);
      return cachedFolders;
    }

    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    // Keep track of discovered folder paths to avoid duplicates
    const discoveredPaths = new Set<string>();
    const discoveredFolders: Folder[] = [];

    const scanDirectory = async (dirPath: string, depth = 0) => {
      // Limit recursion depth and prevent duplicate scans
      if (depth > SCAN_DEPTH_LIMIT || discoveredPaths.has(dirPath)) return;

      // Mark this directory as scanned
      discoveredPaths.add(dirPath);

      try {
        const items = await RNFS.readDir(dirPath);

        // Check if this directory contains images
        const matchingFiles = items.filter(item =>
          item.isFile() && isFileMatchingCategory(item.name, title)
        );

        if (matchingFiles.length > 0) {
          const pathParts = dirPath.split('/');
          let folderName = pathParts[pathParts.length - 1] ||
            pathParts[pathParts.length - 2] || 'Unknown';

          // Unique naming strategy
          let uniqueName = folderName;
          let counter = 1;
          while (discoveredFolders.some(f => f.name === uniqueName)) {
            uniqueName = `${folderName} (${counter++})`;
          }

          discoveredFolders.push({
            name: uniqueName,
            path: dirPath,
            fileCount: matchingFiles.length
          });
        }

        // Parallel subdirectory scanning with filter
        const subDirectories = items
          .filter(item =>
            item.isDirectory() &&
            !SKIP_DIRECTORIES.includes(item.name) &&
            !item.name.startsWith('.')
          );

        // Use Promise.all for concurrent directory scanning
        await Promise.all(
          subDirectories.map(dir => scanDirectory(dir.path, depth + 1))
        );

      } catch (err) {
        console.log(`Error scanning directory ${dirPath}:`, err);
      }
    };

    try {
      setLoading(true);

      // Concurrent base directory scanning for specific category
      const baseDirsForCategory = BASE_DIRECTORIES[title as keyof typeof BASE_DIRECTORIES] || [RNFS.ExternalStorageDirectoryPath];
      // Concurrent base directory scanning
      await Promise.all(baseDirsForCategory.map(baseDir => scanDirectory(baseDir)));

      const sortedFolders = discoveredFolders
        .sort((a, b) => (b.fileCount || 0) - (a.fileCount || 0))
        .slice(0, 100);

      // Set folders
      setFolders(sortedFolders);

      // Cache the folders
      await setCachedData(cacheKey, sortedFolders);

      setFolders(sortedFolders);
      return sortedFolders;
    } catch (err) {
      console.log('Error discovering folders:', err);
      return []
    } finally {
      setLoading(false);
    }
  }, [route.params.title, isFileMatchingCategory]);

  const loadFiles = useCallback(async (folderPath: string) => {

    // Create a unique cache key for this specific folder and category
    const cacheKey = `${folderPath}_${route.params.title}_files`;

    // Check cached files for this folder
    const cachedFiles = await getCachedData(cacheKey);
    if (cachedFiles) {
      setFiles(cachedFiles);
      setSelectedFolder(folderPath);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const folderContents = await RNFS.readDir(folderPath);
      const matchingFiles = folderContents
        .filter(item => item.isFile() && isFileMatchingCategory(item.name, route.params.title))
        .map(file => ({
          name: file.name,
          path: file.path,
          type: getFileType(file.name)
        }))
        .slice(0, MAX_FILES);

      // Cache the files for this folder
      await setCachedData(cacheKey, matchingFiles);

      setFiles(matchingFiles);
      setSelectedFolder(folderPath);
    } catch (err) {
      console.log(`Error reading folder ${folderPath}:`, err);
    } finally {
      setLoading(false);
    }
  }, [route.params.title, isFileMatchingCategory, getFileType]);

  // Effect to initialize screen based on category
  useEffect(() => {
    const initializeScreen = async () => {
      const { title } = route.params;
      if (['Photos', 'Videos', 'Audio', 'Documents', 'APKs', 'Archives'].includes(title)) {
        await discoverFolders();
      }
    };
    initializeScreen();
  }, [route.params.title, discoverFolders]);

  const openFile = (filePath: string, type: File['type']) => {
    if (type === 'image') {
      // Find the index of the selected image in image files
      const imageFiles = files.filter(file => file.type === 'image');
      const index = imageFiles.findIndex(file => `file://${file.path}` === `file://${filePath}`);

      setCurrentImageIndex(index);
      setSelectedFile(`file://${filePath}`);
      setFileType(type);
      setImageViewerVisible(true);
    } else if (type === 'audio') {
      // Find the index of the selected audio in audio files
      const audioFiles = files.filter(file => file.type === 'audio');
      const index = audioFiles.findIndex(file => file.path === filePath);

      setCurrentAudioIndex(index);
      setSelectedFile(`file://${filePath}`);
      setFileType(type);
      getAudioFileDetails(`file://${filePath}`);
    } else if (type === 'video') {
      // Find the index of the selected video in video files
      const videoFiles = files.filter(file => file.type === 'video');
      const index = videoFiles.findIndex(file => file.path === filePath);
  
      setCurrentVideoIndex(index);
      setSelectedFile(`file://${filePath}`);
      setFileType(type);
    } else if (type === 'document') {
      // New document handling logic
      setDocumentFile({
        path: `file://${filePath}`,
        name: filePath.split('/').pop() || 'Unknown'
      });
    } else {
      setSelectedFile(`file://${filePath}`);
      setFileType(type);
    }
  };

  // Add a handler to close the document viewer
  const closeDocumentViewer = () => {
    setDocumentFile(null);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setFileType(null);
    setImageViewerVisible(false);
    setDetailsVisible(false);
  };

  // Add this function to handle track changes
  const handleTrackChange = (newIndex: number) => {
    const audioFiles = files.filter(file => file.type === 'audio');
    if (audioFiles.length === 0 || newIndex < 0 || newIndex >= audioFiles.length) return;

    const newFile = audioFiles[newIndex];
    setSelectedFile(`file://${newFile.path}`);
    setCurrentAudioIndex(newIndex);
    getAudioFileDetails(`file://${newFile.path}`);
  };

  // const navigateBack = () => {
  //   if (selectedFolder) {
  //     setSelectedFolder(null);
  //     // Re-fetch folder list when going back to folder list
  //     // if (route.params.title === 'Photos') {
  //     //   discoverFolders();
  //     // }
  //   } else {
  //     navigation.goBack();
  //   }
  // };

  const showImageFileDetails = async (imageUri: string) => {
    try {
      const filePath = imageUri.replace('file://', '');
      const stats = await RNFS.stat(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      const lastModifiedDate = new Date(stats.mtime);
      const fileName = filePath.split('/').pop();

      // Format date
      const day = lastModifiedDate.getDate().toString().padStart(2, '0');
      const month = (lastModifiedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = lastModifiedDate.getFullYear();
      const minutes = lastModifiedDate.getMinutes().toString().padStart(2, '0');
      const seconds = lastModifiedDate.getSeconds().toString().padStart(2, '0');
      const ampm = lastModifiedDate.getHours() >= 12 ? 'PM' : 'AM';
      let hours12 = lastModifiedDate.getHours() % 12;
      hours12 = hours12 ? hours12 : 12;
      const lastModified = `${day}/${month}/${year} ${hours12}:${minutes}:${seconds} ${ampm}`;

      // Get image dimensions
      const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
        Image.getSize(imageUri, (width, height) => resolve({ width, height }));
      });

      setImageFileDetails({
        size: sizeInMB,
        lastModified,
        fileName: fileName || '',
        filePath,
        dimensions: `${dimensions.width} × ${dimensions.height} Pixels`,
      });

      // Open details modal
      setDetailsVisible(true);
      console.log("is set details visitble: ", isDetailsVisible)
    } catch (error) {
      console.error('Error showing file details:', error);
    }
  };

  const renderFile = ({ item }: { item: File }) => {
    // Function to get document icon and color
    const getDocumentIconInfo = (fileName: string) => {
      const extension = fileName.toLowerCase().split('.').pop();
      
      switch (extension) {
        case 'pdf':
          return { icon: 'file-pdf-o', color: '#FF0000' }; // Red for PDF
        case 'doc':
        case 'docx':
          return { icon: 'file-word-o', color: '#2B579A' }; // Word blue
        case 'xls':
        case 'xlsx':
          return { icon: 'file-excel-o', color: '#217346' }; // Excel green
        case 'ppt':
        case 'pptx':
          return { icon: 'file-powerpoint-o', color: '#D24726' }; // PowerPoint orange
        case 'txt':
          return { icon: 'file-text-o', color: '#666666' }; // Grey for text
        case 'html':
        case 'htm':
          return { icon: 'html5', color: '#E34F26' }; // HTML orange
        case 'csv':
          return { icon: 'table', color: '#217346' }; // Same as Excel
        case 'rtf':
          return { icon: 'file-text-o', color: '#666666' }; // Grey for RTF
        default:
          return { icon: 'file-o', color: '#666666' }; // Default grey
      }
    };
  
    // Get icon info based on file type
    let iconInfo = { icon: '', color: '#666666' };
    
    if (item.type === 'document') {
      iconInfo = getDocumentIconInfo(item.name);
    } else {
      // Use existing logic for other file types with colors
      switch(item.type) {
        case 'image':
          iconInfo = { icon: 'file-image-o', color: '#3498DB' }; // Blue for images
          break;
        case 'audio':
          iconInfo = { icon: 'file-audio-o', color: '#9B59B6' }; // Purple for audio
          break;
        case 'video':
          iconInfo = { icon: 'file-video-o', color: '#E74C3C' }; // Red for video
          break;
        case 'apk':
          iconInfo = { icon: 'android', color: '#A4C639' }; // Android green
          break;
        case 'archive':
          iconInfo = { icon: 'file-archive-o', color: '#F39C12' }; // Orange for archives
          break;
        default:
          iconInfo = { icon: 'file-o', color: '#666666' };
      }
    }
  
    return (
      <TouchableOpacity
        style={styles.fileItem}
        onPress={() => openFile(item.path, item.type)}
      >
        <Icon
          name={iconInfo.icon}
          size={30}
          color={iconInfo.color}
        />
        <Text style={styles.fileName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderFolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => loadFiles(item.path)}
    >
      <Icon name="folder" size={30} color="#FFD700" />
      <View style={styles.folderInfoContainer}>
        <Text style={styles.fileName}>{item.name}</Text>
        {item.fileCount !== undefined && (
          <Text style={styles.fileCount}>
            {item.fileCount} {item.fileCount === 1 ? route.params.title.slice(0, -1).toLowerCase() : route.params.title.toLowerCase()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render content based on state
  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (selectedFolder === null) {
      // Show folder list for Photos, otherwise show files
      console.log("route params title: ", route.params.title);
      if (['Photos', 'Videos', 'Audio', 'Documents', 'APKs', 'Archives'].includes(route.params.title)) {
        return folders.length > 0 ? (
          <FlatList
            data={folders}
            keyExtractor={(item) => item.path}
            renderItem={renderFolder}
          />
        ) : (
          <Text style={styles.noFiles}>No folders found</Text>
        );
      }

      return files.length > 0 ? (
        <FlatList
          data={files}
          keyExtractor={(item) => item.path}
          renderItem={renderFile}
        />
      ) : (
        <Text style={styles.noFiles}>No {route.params.title} found</Text>
      );
    }

    // Show files inside the selected folder
    return files.length > 0 ? (
      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        renderItem={renderFile}
      />
    ) : (
      <Text style={styles.noFiles}>No files found in this folder</Text>
    );
  }, [loading, selectedFolder, route.params.title, folders, files]);

  const closeDetailsModal = () => {
    setDetailsVisible(false);
    setImageFileDetails(null);
  };

  const getAudioFileDetails = async (filePath: string) => {
    try {
      const fileStat = await RNFS.stat(filePath);
      console.log('File Size:', fileStat.size); // in bytes
      console.log('Modified Date:', fileStat.mtime); // Date object

      // Optional: format the size to MB
      const sizeInMB = (fileStat.size / (1024 * 1024)).toFixed(2);

      // Format date
      const dateObj = new Date(fileStat.mtime);

      // Format: 16 November 2024
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Format: 4:11 pm
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase(); // Make sure 'PM' becomes 'pm'

      // Final format: 16 November 2024 at 4:11 pm
      const finalFormattedDate = `${formattedDate} at ${formattedTime}`;

      setAudioFileDetails({
        size: sizeInMB || 'Not found',
        modifiedDate: finalFormattedDate || 'Not found',
      });
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  };


  return (
    <View style={styles.container}>
      { <OrientationLocker orientation="PORTRAIT" />}
      {renderContent}

      {/* Advanced Image Viewer with Swipe and Header */}
      {fileType === 'image' && (
        <ImageView
          images={files
            .filter(file => file.type === 'image')
            .map(file => ({ uri: `file://${file.path}` }))}
          imageIndex={currentImageIndex}
          visible={true}
          onRequestClose={closeModal}
          presentationStyle="overFullScreen" // new
          swipeToCloseEnabled={true} // new
          HeaderComponent={({ imageIndex }) => {
            const currentFile = files
              .filter(file => file.type === 'image')
            [imageIndex];

            return (
              <View style={styles.imageViewerHeader}>

                <View style={styles.detailsIconContainer}>
                  <TouchableOpacity
                    onPress={() => showImageFileDetails(`file://${files.filter(file => file.type === 'image')[imageIndex].path}`)}
                  >
                    <Icon name="info-circle" size={30} color="white" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.imageTitleName} numberOfLines={1} ellipsizeMode="tail">
                  {currentFile?.name}
                </Text>

                <TouchableOpacity
                  style={styles.closeIconContainer}
                  onPress={closeModal}
                >
                  <Icon name="close" size={30} color="white" />
                </TouchableOpacity>
              </View>

            );
          }}
          FooterComponent={({ imageIndex }) => {
            const imageFiles = files.filter(file => file.type === 'image');
            return (
              <View style={styles.imageViewerFooter}>
                <Text style={styles.imageIndexFooter}>
                  {imageIndex + 1} / {imageFiles.length}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* File Details Modal */}
      {isDetailsVisible && isImageViewerVisible && (
        <BottomsheetModal
          visible={isDetailsVisible}
          onDismiss={closeDetailsModal}
          containerStyle={styles.fileDetailsBottomSheet}
          fileDetails={imageFileDetails}
        >
        </BottomsheetModal>
      )}

      {fileType === 'audio' && selectedFile && (
        <AudioPlayerModal
          visible={true}
          audioUri={selectedFile}
          fileDetails={audioFileDetails}
          onRequestClose={closeModal}
          audioFiles={files.filter(file => file.type === 'audio') as { name: string; path: string; type: 'audio'; }[]}
          currentIndex={currentAudioIndex}
          onChangeTrack={handleTrackChange}
        />
      )}

      {fileType === 'video' && selectedFile && (
        <VideoPlayerModal
          visible={true}
          videoUri={selectedFile}
          onRequestClose={closeModal}
          videoFiles={files.filter(file => file.type === 'video') as { name: string; path: string; type: 'video'; }[]}
          currentIndex={currentVideoIndex}
        />
      )}

      {/* New Document Viewer Component */}
      {documentFile && (
        <DocumentViewer
          visible={!!documentFile}
          filePath={documentFile.path}
          fileName={documentFile.name}
          onClose={closeDocumentViewer} />
      )}
    </View>
  );
};

export default CategoryScreen;
