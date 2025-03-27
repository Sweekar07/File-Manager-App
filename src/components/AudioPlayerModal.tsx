// src/components/AudioPlayerModal.tsx

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome';
import TrackPlayer, {
  State,
  Event,
  Track,
  useProgress,
  usePlaybackState
} from 'react-native-track-player';

interface AudioPlayerModalProps {
  visible: boolean;
  audioUri: string;
  fileDetails?: any;
  onRequestClose: () => void;
  audioFiles?: Array<{
    name: string;
    path: string;
    type: 'audio';
  }>;
  currentIndex?: number;
  onChangeTrack?: (newIndex: number) => void;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ visible, audioUri, fileDetails, onRequestClose, audioFiles = [], currentIndex = 0, onChangeTrack }) => {

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const playbackState = usePlaybackState();
  const progress = useProgress();

  const preparePlaylist = useCallback(async () => {
    try {
      // Reset current playlist
      await TrackPlayer.reset();

      // Prepare tracks for playlist
      const tracks: Track[] = audioFiles.map((file) => ({
        url: file.path,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
      }));

      // Add tracks to playlist
      await TrackPlayer.add(tracks);

      // Skip to current index
      if (currentIndex !== undefined) {
        await TrackPlayer.skip(currentIndex);
      }

      // Start playing
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error preparing playlist:', error);
    }
  }, [audioFiles, currentIndex]);

  // Play/Pause toggle
  const togglePlayPause = async () => {
    const state = await TrackPlayer.getState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  // Skip forward/backward
  const skipForward = async () => {
    await TrackPlayer.seekTo(progress.position + 10);
  };

  const skipBackward = async () => {
    await TrackPlayer.seekTo(Math.max(0, progress.position - 10));
  };

  // Play next song
  const playNextSong = async () => {
    if (audioFiles.length <= 1) return;
    await TrackPlayer.skipToNext();
    if (onChangeTrack) {
      const nextIndex = (currentIndex + 1) % audioFiles.length;
      onChangeTrack(nextIndex);
    }
  };

  // Play previous song
  const playPreviousSong = async () => {
    if (audioFiles.length <= 1) return;
    await TrackPlayer.skipToPrevious();
    if (onChangeTrack) {
      const prevIndex = (currentIndex - 1 + audioFiles.length) % audioFiles.length;
      onChangeTrack(prevIndex);
    }
  };

  // Set volume
  const setAudioVolume = async (value: number) => {
    await TrackPlayer.setVolume(value);
    setVolume(value);
  };

  useEffect(() => {
    if (visible) {
      preparePlaylist();
    }

    // return () => {
    //   TrackPlayer.reset();
    // };
  }, [visible, audioFiles, currentIndex, preparePlaylist]);

  // Update playing state based on playback state
  useEffect(() => {
    setIsPlaying(playbackState.state === State.Playing);
  }, [playbackState]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fileName = audioUri.split('/').pop() || 'Unknown Song';
  const songName = fileName.replace(/\.[^/.]+$/, "");

  // Check if navigation buttons should be enabled
  const hasMultipleSongs = audioFiles.length > 1;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onRequestClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.musicPlayerContainer}>

            {/* Header with back button and options */}
            <View style={styles.musicPlayerHeader}>
              <TouchableOpacity onPress={onRequestClose}>
                <Icon name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.musicPlayerTitle}>Music Player</Text>
              <TouchableOpacity onPress={() => setShowOptions(true)} style={{ padding: 5 }}>
                <Icon name="ellipsis-v" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* To display File info  */}
            <Modal visible={showOptions} transparent animationType="fade">
              <TouchableOpacity style={styles.optionsOverlay} onPress={() => setShowOptions(false)}>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity onPress={() => { setShowDetails(true); setShowOptions(false); }}>
                    <Text style={styles.optionText}>File info</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* After user clicks on above displayed File info */}
            <Modal visible={showDetails} transparent={false} animationType="slide" onRequestClose={() => setShowDetails(false)}>
              <ScrollView style={styles.detailsContainer}>

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
                      <Text style={styles.detailItem}>{fileDetails?.size} MB  •  {formatTime(progress.duration)}</Text>
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
              </ScrollView>
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
                maximumValue={progress.duration}
                value={progress.position}
                onSlidingComplete={async (value) => {
                  await TrackPlayer.seekTo(value);
                }}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#555555"
                thumbTintColor="#FFFFFF"
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
                <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
              </View>
            </View>

            {/* Song info */}
            <View style={styles.songInfoContainer}>
              <Text style={styles.songTitle}>{songName}</Text>
              <Text style={styles.songArtist}>Unknown Artist</Text>
            </View>

            {/* Player controls */}
            <View style={styles.playerControlsContainer}>
              <TouchableOpacity
                onPress={playPreviousSong}
                disabled={!hasMultipleSongs}>
                <Icon name="step-backward" size={30} color={hasMultipleSongs ? "white" : "#555"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={skipBackward}>
                <Icon name="rotate-left" size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayPause}
              >
                <Icon name={isPlaying ? 'pause' : 'play'} size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={skipForward}>
                <Icon name="rotate-right" size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={playNextSong}
                disabled={!hasMultipleSongs}>
                <Icon name="step-forward" size={30} color={hasMultipleSongs ? "white" : "#555"} />
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
        </ScrollView>
      </SafeAreaView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginVertical: 100,
  },
  musicIconCircle: {
    width: 200,
    height: 200,
    borderRadius: 150,
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
