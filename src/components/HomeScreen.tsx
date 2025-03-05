// src/components/HomeScreen.tsx

import React, { useEffect, useState , useCallback} from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';
import styles from '../styles/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HomeScreenProps {
  navigation: any;
}

interface CategoryItem {
  name: string;
  icon: string;
  count: string;
  extensions: RegExp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [usedSpace, setUsedSpace] = useState(0);
  const [totalSpace, setTotalSpace] = useState(256); // Default total space, will update dynamically
  const [categories, setCategories] = useState<CategoryItem[]>([
    { name: 'Photos', icon: 'image', count: 'Loading...', extensions: /\.(jpg|jpeg|png|gif|bmp|webp)$/i },
    { name: 'Videos', icon: 'video-camera', count: 'Loading...', extensions: /\.(mp4|mkv|avi|mov|flv|wmv)$/i },
    { name: 'Audio', icon: 'music', count: 'Loading...', extensions: /\.(mp3|wav|ogg|m4a|flac)$/i },
    { name: 'Documents', icon: 'file-text', count: 'Loading...', extensions: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i },
    { name: 'APKs', icon: 'android', count: 'Loading...', extensions: /\.(apk)$/i },
    { name: 'Archives', icon: 'archive', count: 'Loading...', extensions: /\.(zip|rar|tar|7z|gz)$/i },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const calculateStorageUsage = async () => {
    try {
      // Check if cached storage info exists
      const cachedStorageInfo = await AsyncStorage.getItem('storageInfo');
      const currentTime = Date.now();

      if (cachedStorageInfo) {
        const { totalSpace: cachedTotal, usedSpace: cachedUsed, timestamp } = JSON.parse(cachedStorageInfo);
        
        // Use cached data if it's less than 1 hour old
        if (currentTime - timestamp < 3600000) {
          setTotalSpace(cachedTotal);
          setUsedSpace(cachedUsed);
          return;
        }
      }

      // Fetch fresh storage info
      const stat = await RNFS.getFSInfo();
      const freshTotalSpace = parseFloat((stat.totalSpace / (1024 ** 3)).toFixed(2)); // Convert bytes to GB
      const freshUsedSpace = parseFloat(((stat.totalSpace - stat.freeSpace) / (1024 ** 3)).toFixed(2)); // Used Space in GB

      // Cache the new storage info
      await AsyncStorage.setItem('storageInfo', JSON.stringify({
        totalSpace: freshTotalSpace,
        usedSpace: freshUsedSpace,
        timestamp: currentTime
      }));
      setTotalSpace(freshTotalSpace); 
      setUsedSpace(freshUsedSpace); 
    } catch (error) {
      console.error('Error retrieving storage info:', error);
    }
  };

  const countFilesByCategory = async () => {
    try {
      const directoryPath = RNFS.ExternalStorageDirectoryPath;
      const cachedFileCounts = await AsyncStorage.getItem('fileCounts');
      const currentTime = Date.now();

      // Check if cached file counts exist and are recent
      if (cachedFileCounts) {
        const parsedCounts = JSON.parse(cachedFileCounts);
        if (currentTime - parsedCounts.timestamp < 3600000) {
          // Use cached categories if less than 1 hour old
          setCategories(parsedCounts.categories);
          return parsedCounts.categories;
        }
      }

      const countFiles = async (path: string, regex: RegExp): Promise<number> => {
        try {
          const files = await RNFS.readDir(path);
          if (!files || files.length === 0) return 0;

          let count = 0;
          for (const file of files) {
            if (file.isFile() && regex.test(file.name)) {
              count++;
            } else if (file.isDirectory()) {
              count += await countFiles(file.path, regex);
            }
          }
          return count;
        } catch (error) {
          console.error(`Failed to read directory: ${path}`, error);
          return 0;
        }
      };

      // Count files for each category dynamically
      const updatedCategories = await Promise.all(
        categories.map(async (category) => {
          const count = await countFiles(directoryPath, category.extensions);
          return { ...category, count: count.toString() };
        })
      );

      // Cache the file counts
      await AsyncStorage.setItem('fileCounts', JSON.stringify({
        categories: updatedCategories,
        timestamp: currentTime
      }));

      setCategories(updatedCategories);
      return updatedCategories;
    } catch (error) {
      console.error('Error counting files:', error);
      return categories;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cached data
      await AsyncStorage.multiRemove(['storageInfo', 'fileCounts']);
      
      // Recalculate storage and file counts
      await Promise.all([
        calculateStorageUsage(),
        countFilesByCategory()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    calculateStorageUsage();
    countFilesByCategory();
  }, []);

  useEffect(() => {
    calculateStorageUsage();
    countFilesByCategory();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['green']}
          tintColor={'green'}
        />
      }
    >
      <Text style={styles.title}>Files</Text>
      <View style={styles.searchBarContainer}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput style={styles.searchBar} placeholder="Search" placeholderTextColor="#888" />
      </View>
      <View style={styles.storageBox}>
        <Text style={styles.storageTitle}>Device Storage</Text>
        <View style={styles.storageDetails}>
          <Text style={styles.storageUsed}>{usedSpace} GB</Text>
          <Text style={styles.storageTotal}>{totalSpace} GB</Text>
        </View>
        <ProgressBar progress={usedSpace / totalSpace} color="green" />
      </View>
      <View style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <TouchableOpacity 
            style={styles.categoryBox} 
            key={index} 
            onPress={() => navigation.navigate('CategoryScreen', { title: category.name })}
          >
            <Icon name={category.icon} size={30} color="#666" />
            <Text style={styles.categoryText}>{category.name}</Text>
            <Text style={styles.categoryCount}>{category.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
