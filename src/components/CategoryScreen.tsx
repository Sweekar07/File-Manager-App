// src/components/CategoryScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import styles from '../styles/styles';
import { requestStoragePermission } from '../utils/permissions';
import ImageViewerModal from './ImageViewerModal';
import AudioPlayerModal from './AudioPlayerModal';
import VideoPlayerModal from './VideoPlayerModal';

interface CategoryScreenProps {
  route: any;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ route }) => {
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'audio' | 'video' | 'document' | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
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
                (route.params.title === 'Photos' && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lowerName)) ||
                (route.params.title === 'Audio' && /\.(mp3|wav|aac|flac)$/i.test(lowerName)) ||
                (route.params.title === 'Videos' && /\.(mp4|mkv|avi)$/i.test(lowerName)) ||
                (route.params.title === 'Documents' && /\.(pdf|doc|docx|txt)$/i.test(lowerName))
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
        await traverseFolder(RNFS.ExternalStorageDirectoryPath);
        setFiles(result);
      } catch (err) {
        console.log('Error traversing directories:', err);
      }
    };

    loadFiles();
  }, [route.params.title]);

  const openFile = (filePath: string, type: 'image' | 'audio' | 'video' | 'document') => {
    setSelectedFile(`file://${filePath}`);
    setFileType(type);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setFileType(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.fileList} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
        {files.length > 0 ? (
          files.map((file, index) => {
            const type = file.name.toLowerCase().includes('.mp3') || file.name.toLowerCase().includes('.wav') || file.name.toLowerCase().includes('.aac') || file.name.toLowerCase().includes('.flac')
              ? 'audio'
              : file.name.toLowerCase().includes('.mp4') || file.name.toLowerCase().includes('.mkv') || file.name.toLowerCase().includes('.avi')
              ? 'video'
              : file.name.toLowerCase().includes('.pdf') || file.name.toLowerCase().includes('.doc') || file.name.toLowerCase().includes('.docx') || file.name.toLowerCase().includes('.txt')
              ? 'document'
              : 'image';

            return (
              <TouchableOpacity
                key={index}
                style={styles.fileItem}
                onPress={() => openFile(file.path, type)}
              >
                <Icon name={type === 'image' ? 'file-image-o' : type === 'audio' ? 'file-audio-o' : type === 'video' ? 'file-video-o' : 'file-text-o'} size={30} color="#666" />
                <Text style={styles.fileName}>{file.name}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noFiles}>No {route.params.title} found</Text>
        )}
      </ScrollView>

      {fileType === 'image' && selectedFile && (
        <ImageViewerModal
          visible={true}
          images={files.map((file) => ({ uri: `file://${file.path}` }))}
          initialIndex={files.findIndex((file) => `file://${file.path}` === selectedFile)}
          onRequestClose={closeModal}
        />
      )}

      {fileType === 'audio' && selectedFile && (
        <AudioPlayerModal visible={true} audioUri={selectedFile} onRequestClose={closeModal} />
      )}

      {fileType === 'video' && selectedFile && (
        <VideoPlayerModal visible={true} videoUri={selectedFile} onRequestClose={closeModal} />
      )}

      {fileType === 'document' && selectedFile && (
        <TouchableOpacity onPress={() => {
          FileViewer.open(selectedFile.replace('file://', ''), { showOpenWithDialog: true })
            .catch(() => {
              console.log('Failed to open the document');
            });
        }}>
          <Text style={styles.fileName}>Open Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CategoryScreen;
