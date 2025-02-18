// src/components/AudioPlayerModal.tsx

import React, { useRef, useState, useEffect } from 'react';
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
  const soundRef = useRef<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playAudio = (audioPath: string) => {
    if (soundRef.current) {
      soundRef.current.stop(() => {
        soundRef.current = new Sound(audioPath, '', (error) => {
          if (error) {
            console.log('Failed to load the sound', error);
            return;
          }
          soundRef.current?.setCurrentTime(currentTime); // Resume from current time
          soundRef.current?.play((success) => {
            if (success) {
              console.log('successfully finished playing');
            } else {
              console.log('playback failed due to audio decoding errors');
            }
          });
          setIsPlaying(true);
          soundRef.current?.getCurrentTime((seconds) => setCurrentTime(seconds));
          setDuration(soundRef.current?.getDuration() || 0);
        });
      });
    } else {
      soundRef.current = new Sound(audioPath, '', (error) => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        soundRef.current?.play((success) => {
          if (success) {
            console.log('successfully finished playing');
          } else {
            console.log('playback failed due to audio decoding errors');
          }
        });
        setIsPlaying(true);
        soundRef.current?.getCurrentTime((seconds) => setCurrentTime(seconds));
        setDuration(soundRef.current?.getDuration() || 0);
      });
    }
  };

  const pauseAudio = () => {
    if (soundRef.current) {
      soundRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const seekAudio = (seconds: number) => {
    if (soundRef.current) {
      soundRef.current.setCurrentTime(seconds);
      setCurrentTime(seconds);
    }
  };

  useEffect(() => {
    if (visible) {
      playAudio(audioUri);
    }
    return () => {
      stopAudio();
    };
  }, [visible, audioUri]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (soundRef.current && isPlaying) {
        soundRef.current.getCurrentTime((seconds) => setCurrentTime(seconds));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onRequestClose}>
      <Pressable style={styles.modalOverlay} onPress={onRequestClose}>
        <View style={styles.audioPlayerContainer}>
        <Text style={styles.audioPlayerTitle}>Playing: {audioUri.split('/').pop()}</Text>
          <Text style={styles.audioTime}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
          <View style={styles.audioControls}>
            <TouchableOpacity onPress={() => seekAudio(currentTime - 10)}>
              <Icon name="backward" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={isPlaying ? pauseAudio : () => playAudio(audioUri)}>
              <Icon name={isPlaying ? 'pause' : 'play'} size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekAudio(currentTime + 10)}>
              <Icon name="forward" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default AudioPlayerModal;
