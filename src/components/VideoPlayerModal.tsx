// src/components/VideoPlayerModal.tsx

import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import Video from 'react-native-video';
import styles from '../styles/styles';

interface VideoPlayerModalProps {
  visible: boolean;
  videoUri: string;
  onRequestClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ visible, videoUri, onRequestClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onRequestClose}>
      <Pressable style={styles.modalOverlay} onPress={onRequestClose}>
        <View style={styles.videoPlayerContainer}>
          <Video source={{ uri: videoUri }} style={styles.videoPlayer} controls={true} />
        </View>
      </Pressable>
    </Modal>
  );
};

export default VideoPlayerModal;
