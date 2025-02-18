// src/components/HomeScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ProgressBarAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';
import styles from '../styles/styles';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [usedSpace, setUsedSpace] = useState(0);
  const [totalSpace, setTotalSpace] = useState(256); // Default total space, will update dynamically
  const [categories, setCategories] = useState([
    { name: 'Photos', icon: 'image', count: 'Loading...', extensions: /\.(jpg|jpeg|png|gif|bmp|webp)$/i },
    { name: 'Videos', icon: 'video-camera', count: 'Loading...', extensions: /\.(mp4|mkv|avi|mov|flv|wmv)$/i },
    { name: 'Audio', icon: 'music', count: 'Loading...', extensions: /\.(mp3|wav|ogg|m4a|flac)$/i },
    { name: 'Documents', icon: 'file-text', count: 'Loading...', extensions: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i },
    { name: 'APKs', icon: 'android', count: 'Loading...', extensions: /\.(apk)$/i },
    { name: 'Archives', icon: 'archive', count: 'Loading...', extensions: /\.(zip|rar|tar|7z|gz)$/i },
  ]);

  const calculateStorageUsage = async () => {
    try {
      const stat = await RNFS.getFSInfo();
      setTotalSpace(parseFloat((stat.totalSpace / (1024 ** 3)).toFixed(2))); // Convert bytes to GB
      setUsedSpace(parseFloat(((stat.totalSpace - stat.freeSpace) / (1024 ** 3)).toFixed(2))); // Used Space in GB
    } catch (error) {
      console.error('Error retrieving storage info:', error);
    }
  };

  const countFilesByCategory = async () => {
    try {
      const directoryPath = RNFS.ExternalStorageDirectoryPath;
      const pathExists = await RNFS.exists(directoryPath);
      if (!pathExists) {
        console.error(`Directory does not exist: ${directoryPath}`);
        return;
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

      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error counting files:', error);
    }
  };

  useEffect(() => {
    calculateStorageUsage();
    countFilesByCategory();
  }, []);

  return (
    <View style={styles.container}>
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
        <ProgressBarAndroid styleAttr="Horizontal" color="green" indeterminate={false} progress={usedSpace / totalSpace} style={styles.progressBar} />
      </View>
      <View style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <TouchableOpacity style={styles.categoryBox} key={index} onPress={() => navigation.navigate('CategoryScreen', { title: category.name })}>
            <Icon name={category.icon} size={30} color="#666" />
            <Text style={styles.categoryText}>{category.name}</Text>
            <Text style={styles.categoryCount}>{category.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HomeScreen;
