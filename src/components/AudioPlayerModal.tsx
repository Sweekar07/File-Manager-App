// src/components/AudioPlayerModal.tsx

import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome';
import Sound from 'react-native-sound';

interface AudioPlayerModalProps {
  visible: boolean;
  audioUri: string;
  fileDetails?: any;
  onRequestClose: () => void;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ visible, audioUri, fileDetails, onRequestClose }) => {  
  const soundRef = useRef<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // State for showing file details


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
            setIsPlaying(false);
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
          setIsPlaying(false);
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

  const setAudioVolume = (value: number) => {
    if (soundRef.current) {
      soundRef.current.setVolume(value);
      setVolume(value);
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

  const fileName = audioUri.split('/').pop() || 'Unknown Song';
  // Remove file extension for display
  const songName = fileName.replace(/\.[^/.]+$/, "");

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onRequestClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.musicPlayerContainer}>
          {/* Header with back button and options */}
          <View style={styles.musicPlayerHeader}>
            <TouchableOpacity onPress={onRequestClose}>
              <Icon name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.musicPlayerTitle}>Music Player</Text>
            <TouchableOpacity onPress={() => setShowOptions(true)} style={{ padding: 5}}>
              <Icon name="ellipsis-v" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Modal visible={showOptions} transparent animationType="fade">
            <TouchableOpacity style={styles.optionsOverlay} onPress={() => setShowOptions(false)}>
              <View style={styles.optionsContainer}>
                <TouchableOpacity onPress={() => { setShowDetails(true); setShowOptions(false); }}>
                  <Text style={styles.optionText}>File info</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal visible={showDetails} transparent={false} animationType="slide" onRequestClose={() => setShowDetails(false)}>
            <View style={styles.detailsContainer}>

              {/* Top 40% Section with Back Icon and Music Logo */}
              <View style={styles.detailsTopSection}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => setShowDetails(false)}>
                  <Icon name="arrow-left" size={28} color="white" />
                </TouchableOpacity>

                {/* Music Icon */}
                <View style={styles.detailsMusicIcon}>
                  <Icon name="music" size={100} color="#A020F0" />
                </View>
              </View>

              {/* Bottom 60% Details */}
              <View style={styles.detailsBottomSection}>
                <Text style={styles.detailTitle}>{songName}</Text>
                
                {/* Music file container */}
                <View style={styles.detailContainer}>
                  <Icon name="music" size={30} color="#777" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailItemBold}>{songName}</Text>
                    <Text style={styles.detailItem}>{fileDetails?.size} MB  •  {formatTime(duration)}</Text>
                  </View>
                </View>
                
                {/* Date container */}
                <View style={styles.detailContainer}>
                  <Icon name="calendar" size={30} color="#777" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailItemBold}>Modified {fileDetails?.modifiedDate}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          {/* Music icon/album art */}
          <View style={styles.musicIconContainer}>
            <View style={styles.musicIconCircle}>
              <Icon name="music" size={60} color="white" />
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={duration}
              value={currentTime}
              onValueChange={seekAudio}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#555555"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Song info */}
          <View style={styles.songInfoContainer}>
            <Text style={styles.songTitle}>{songName}</Text>
            <Text style={styles.songArtist}>Unknown Artist</Text>
          </View>

          {/* Player controls */}
          <View style={styles.playerControlsContainer}>
            <TouchableOpacity onPress={() => seekAudio(currentTime - 10)}>
              <Icon name="step-backward" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.playPauseButton}
              onPress={isPlaying ? pauseAudio : () => playAudio(audioUri)}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekAudio(currentTime + 10)}>
              <Icon name="step-forward" size={30} color="white" />
            </TouchableOpacity>
          </View>

          {/* Volume slider */}
          <View style={styles.volumeContainer}>
            <Icon name="volume-down" size={20} color="#AAAAAA" />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={setAudioVolume}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#555555"
              thumbTintColor="#FFFFFF"
            />
            <Icon name="volume-up" size={20} color="#AAAAAA" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AudioPlayerModal;


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicPlayerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#202020',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
  },
  musicPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#444', 
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  musicPlayerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  musicIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  musicIconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
  },
  songInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  songTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  songArtist: {
    color: '#aaa',
    fontSize: 16,
  },
  playerControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#444', 
    paddingVertical: 15,
    borderRadius: 10, 
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    backgroundColor: '#444', 
    paddingVertical: 10,
    borderRadius: 10,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },


  detailContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  detailIcon: {
    marginRight: 15,
    paddingTop: 5,
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  detailItemBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#202020', //black
    // backgroundColor: 'white'
  },
  detailsTopSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'gray',
  },
  detailsMusicIcon: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBottomSection: {
    flex: 0.6,
    padding: 20,
  },
  detailTitle: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBlockEnd: 30
  },
  detailItem: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    position: 'absolute',
    top: 10, // Adjust as needed to align with 3-dot icon (increase/decrease to match position)
    right: 10, // Adjust as needed for padding from left
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: 150, // Control width
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999, // Ensure it overlays everything
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
    textAlign: 'left',
  },
  backButton: {
    position: 'absolute',
    top: 20,          // Adjust as needed to avoid status bar
    left: 20,
    zIndex: 10,       // Ensure it's on top
    padding: 10,
  },
});
