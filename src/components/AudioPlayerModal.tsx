// src/components/AudioPlayerModal.tsx

import React from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Sound from 'react-native-sound';
import styles from '../styles/styles';

interface AudioPlayerModalProps {
  visible: boolean;
  audioUri: string;
  onRequestClose: () => void;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ visible, audioUri, onRequestClose }) => {
  const soundRef = React.useRef<Sound | null>(null);

  const playAudio = (audioPath: string) => {
    if (soundRef.current) {
      soundRef.current.stop(() => {
        soundRef.current = new Sound(audioPath, '', (error) => {
          if (error) {
            console.log('Failed to load the sound', error);
            return;
          }
          soundRef.current?.play();
        });
      });
    } else {
      soundRef.current = new Sound(audioPath, '', (error) => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        soundRef.current?.play();
      });
    }
  };

  const stopAudio = () => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
    }
  };

  React.useEffect(() => {
    if (visible) {
      playAudio(audioUri);
    }
    return () => {
      stopAudio();
    };
  }, [visible, audioUri]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onRequestClose}>
      <Pressable style={styles.modalOverlay} onPress={onRequestClose}>
        <View style={styles.audioPlayerContainer}>
          <Text style={styles.audioPlayerTitle}>Playing: {audioUri}</Text>
          <TouchableOpacity onPress={stopAudio}>
            <Icon name="stop" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

export default AudioPlayerModal;
