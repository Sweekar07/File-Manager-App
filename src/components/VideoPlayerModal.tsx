// src/components/VideoPlayerModal.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import RNFS from 'react-native-fs';
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  ScrollView
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider'; // Import the slider library

interface VideoPlayerModalProps {
  visible: boolean;
  videoUri: string;
  onRequestClose: () => void;
  videoFiles?: { name: string; path: string; type: 'video' }[];
  currentIndex?: number;
}

interface VideoFileDetails {
  size: string;
  modifiedDate: string;
  duration?: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  videoUri,
  onRequestClose,
  videoFiles = [],
  currentIndex = 0
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(currentIndex);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoFileDetails | null>(null);
  const [miniPlayerMode, setMiniPlayerMode] = useState(false);

  const videoRef = useRef<VideoRef>(null);
  const { width: screenWidth } = Dimensions.get('window');
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [videoDuration, setVideoDuration] = useState<string | null>(null);

  const [lastKnownTimestamp, setLastKnownTimestamp] = useState(0);

  // Get the current video URI
  const getCurrentVideoUri = useCallback(() => {
    if (videoFiles.length > 0) {
      return `file://${videoFiles[currentVideoIndex].path}`;
    }
    return videoUri;
  }, [videoFiles, currentVideoIndex, videoUri]);

  // Format time to display as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Fetch video file details from the file system
  const getVideoFileDetails = useCallback(async (filePath: string) => {
    try {
      const fileStat = await RNFS.stat(filePath);
      const sizeInMB = (fileStat.size / (1024 * 1024)).toFixed(2);

      const dateObj = new Date(fileStat.mtime);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      }).toLowerCase();

      const finalFormattedDate = `${formattedDate} at ${formattedTime}`;

      setVideoDetails({ size: sizeInMB, modifiedDate: finalFormattedDate, duration: videoDuration || "Unknown" });
      setShowDetails(true);
      setShowOptions(false); // Close options when opening details
    } catch (error) {
      console.error('Error fetching video details:', error);
    }
  }, [videoDuration]);

  // Show controls temporarily and hide after a timeout
  const showControlsTemporarily = useCallback(() => {
    setIsControlsVisible(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Set new timeout to hide controls
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  }, []);

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    if (isControlsVisible) {
      setIsControlsVisible(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      showControlsTemporarily();
    }
  }, [isControlsVisible, showControlsTemporarily]);

  // Toggle play/pause state
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prevState => !prevState);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Skip forward 10 seconds
  const skipForward = useCallback(() => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      videoRef.current.seek(newTime);
    }
    showControlsTemporarily();
  }, [currentTime, duration, showControlsTemporarily]);

  // Skip backward 10 seconds
  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      videoRef.current.seek(newTime);
    }
    showControlsTemporarily();
  }, [currentTime, showControlsTemporarily]);

  // Handle video progress updates
  const handleProgress = useCallback((data: { currentTime: number }) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
      setLastKnownTimestamp(data.currentTime);
    }
  }, [isSeeking]);

  // Handle video load event
  const handleLoad = useCallback((data: { duration: number }) => {
    const formattedDuration = formatTime(data.duration);
    setVideoDuration(formattedDuration);
    setDuration(data.duration);

    // Seek to the last known timestamp when loading
    if (videoRef.current && lastKnownTimestamp > 0) {
      videoRef.current.seek(lastKnownTimestamp);
    }
  }, [formatTime, lastKnownTimestamp]);

  // Handle seeking start
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
    // setIsPlaying(false);
  }, []);

  // Handle seeking
  const handleSeekChange = useCallback((value: number) => {
    setSeekValue(value);
  }, []);

  // Handle seeking end
  const handleSeekComplete = useCallback((value: number) => {
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    setCurrentTime(value);
    setLastKnownTimestamp(value);
    setIsSeeking(false);
    setIsPlaying(isPlaying);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Handle swipe gestures for navigating between videos
  const handleSwipe = useCallback((event: any) => {
    if (miniPlayerMode) return; // Disable swipe in mini player mode

    const { nativeEvent } = event;

    if (nativeEvent.state === State.ACTIVE) {
      setIsSwipeActive(true);
      setSwipeDistance(nativeEvent.translationX);
    }
    else if (nativeEvent.state === State.END) {
      setIsSwipeActive(false);
      setSwipeDistance(0);

      // Threshold for swipe detection
      const swipeThreshold = screenWidth / 3;

      if (nativeEvent.translationX > swipeThreshold && currentVideoIndex > 0) {
        // Swipe right - go to previous video
        setCurrentVideoIndex(prevIndex => prevIndex - 1);
      }
      else if (nativeEvent.translationX < -swipeThreshold && currentVideoIndex < videoFiles.length - 1) {
        // Swipe left - go to next video
        setCurrentVideoIndex(prevIndex => prevIndex + 1);
      }
    }
  }, [currentVideoIndex, screenWidth, videoFiles.length, miniPlayerMode]);

  // Render swipe indicator when user is swiping
  const renderSwipeIndicator = useCallback(() => {
    if (!isSwipeActive || Math.abs(swipeDistance) < 50 || miniPlayerMode) return null;

    const isNext = swipeDistance < 0;
    const isValid = isNext ? currentVideoIndex < videoFiles.length - 1 : currentVideoIndex > 0;

    return (
      <View style={[
        styles.swipeIndicator,
        { left: isNext ? null : 20, right: isNext ? 20 : null }
      ]}>
        <Icon
          name={isNext ? 'arrow-right' : 'arrow-left'}
          size={30}
          color={isValid ? 'white' : 'gray'}
        />
        <Text style={styles.swipeIndicatorText}>
          {isNext ? 'Next video' : 'Previous video'}
        </Text>
      </View>
    );
  }, [isSwipeActive, swipeDistance, currentVideoIndex, videoFiles.length, miniPlayerMode]);

  // Show file info modal
  const handleShowFileInfo = useCallback(() => {
    const currentUri = getCurrentVideoUri().replace('file://', '');
    getVideoFileDetails(currentUri);
  }, [getCurrentVideoUri, getVideoFileDetails]);

  // Close details modal and reset to player
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
  }, []);

  // Toggle mini player mode
  const toggleMiniPlayerMode = useCallback(() => {
    setMiniPlayerMode(!miniPlayerMode);
    setIsControlsVisible(false);
  }, [miniPlayerMode]);

  // Close mini player
  const closeMiniPlayer = useCallback(() => {
    if (miniPlayerMode) {
      onRequestClose();
    }
  }, [miniPlayerMode, onRequestClose]);

  // Initialize controls and cleanup on mount/unmount
  useEffect(() => {
    showControlsTemporarily();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControlsTemporarily]);

  // Reset video when index changes
  useEffect(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    setLastKnownTimestamp(0);
  }, [currentVideoIndex]);

  // Render mini player UI
  const renderMiniPlayer = () => {
    return (
      <View style={styles.miniPlayerContainer}>
        <View style={styles.miniPlayerTopBar}>
          <TouchableOpacity
            onPress={toggleMiniPlayerMode}
            style={styles.miniPlayerExpand}
          >
            <Icon name="expand" size={18} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRequestClose}
            style={styles.miniPlayerClose}
          >
            <Icon name="times" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.miniPlayerVideoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: getCurrentVideoUri() }}
            style={styles.miniPlayerVideo}
            resizeMode="contain"
            paused={!isPlaying}
            repeat={false}
            onProgress={handleProgress}
            onLoad={handleLoad}
          />
        </View>

        <View style={styles.miniPlayerProgressContainer}>
          <Slider
            style={styles.miniPlayerSlider}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1}
            value={isSeeking ? seekValue : currentTime}
            minimumTrackTintColor="#A020F0"
            maximumTrackTintColor="rgba(160, 32, 240, 0.3)"
            thumbTintColor="#A020F0"
            onSlidingStart={handleSeekStart}
            onValueChange={handleSeekChange}
            onSlidingComplete={handleSeekComplete}
          />
        </View>

        <View style={styles.miniPlayerControlsContainer}>
          <Text style={styles.miniPlayerTimeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>

          <View style={styles.miniPlayerButtonGroup}>
            <TouchableOpacity
              style={styles.miniPlayerControlButton}
              onPress={skipBackward}
            >
              <Icon name="backward" size={16} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.miniPlayerControlButton}
              onPress={togglePlayPause}
            >
              <Icon
                name={isPlaying ? "pause" : "play"}
                size={16}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.miniPlayerControlButton}
              onPress={skipForward}
            >
              <Icon name="forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Main render
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onRequestClose}>
      <StatusBar hidden={!miniPlayerMode} />

      {miniPlayerMode ? (
        renderMiniPlayer()
      ) : (
        <GestureHandlerRootView style={styles.fullScreenContainer}>
          <PanGestureHandler onGestureEvent={handleSwipe} onHandlerStateChange={handleSwipe}>
            <SafeAreaView style={styles.fullScreenContainer}>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.fullScreenContainer}
                onPress={toggleControls}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: getCurrentVideoUri() }}
                  style={styles.fullScreenVideo}
                  resizeMode="contain"
                  paused={!isPlaying}
                  controls={false}
                  repeat={false}
                  onProgress={handleProgress}
                  onLoad={handleLoad}
                />

                {renderSwipeIndicator()}

                {isControlsVisible && (
                  <View style={styles.videoControlsOverlay}>
                    {/* Top controls */}
                    <View style={styles.videoControlsHeader}>
                      <TouchableOpacity
                        onPress={onRequestClose}
                        style={styles.videoBackButton}
                      >
                        <Icon name="arrow-left" size={24} color="white" />
                      </TouchableOpacity>

                      {videoFiles.length > 0 && (
                        <Text style={styles.videoTitle} numberOfLines={1}>
                          {videoFiles[currentVideoIndex].name}
                        </Text>
                      )}

                      {/* Three-dot menu */}
                      <TouchableOpacity onPress={() => setShowOptions(true)} style={{ padding: 5 }}>
                        <Icon name="ellipsis-v" size={24} color="white" />
                      </TouchableOpacity>
                    </View>

                    {/* Options Modal */}
                    {showOptions && (
                      <View style={styles.optionsContainer}>
                        <TouchableOpacity onPress={handleShowFileInfo}>
                          <Text style={styles.optionText}>File info</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Center play/pause button */}
                    <TouchableOpacity
                      onPress={togglePlayPause}
                      style={styles.centerPlayButton}
                    >
                      <Icon name={isPlaying ? "pause" : "play"} size={40} color="white" />
                    </TouchableOpacity>

                    {/* Bottom controls */}
                    <View style={styles.videoControlsFooter}>
                      {/* Progress Bar - Using React Native Slider */}
                      <View style={styles.progressContainer}>
                        <Slider
                          style={styles.slider}
                          minimumValue={0}
                          maximumValue={duration > 0 ? duration : 1}
                          value={isSeeking ? seekValue : currentTime}
                          minimumTrackTintColor="white"
                          maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                          thumbTintColor="white"
                          onSlidingStart={handleSeekStart}
                          onValueChange={handleSeekChange}
                          onSlidingComplete={handleSeekComplete}
                        />
                      </View>

                      {/* Controls and Time Display */}
                      <View style={styles.controlsTimeContainer}>
                        {/* Control Buttons */}
                        <View style={styles.controlButtonsRow}>
                          <TouchableOpacity style={styles.circleButton} onPress={togglePlayPause}>
                            <Icon name={isPlaying ? "pause" : "play"} size={20} color="white" />
                          </TouchableOpacity>

                          {/* {videoFiles.length > 1 && currentVideoIndex > 0 && (
                            <TouchableOpacity
                              style={styles.circleButton}
                              onPress={() => setCurrentVideoIndex(prevIndex => prevIndex - 1)}
                            >
                              <Icon name="step-backward" size={18} color="white" />
                            </TouchableOpacity>
                          )} */}

                          <TouchableOpacity
                            style={styles.circleButton}
                            onPress={skipBackward}
                          >
                            <Icon name="backward" size={18} color="white" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.circleButton}
                            onPress={skipForward}
                          >
                            <Icon name="forward" size={18} color="white" />
                          </TouchableOpacity>

                          {/* {videoFiles.length > 1 && currentVideoIndex < videoFiles.length - 1 && (
                            <TouchableOpacity
                              style={styles.circleButton}
                              onPress={() => setCurrentVideoIndex(prevIndex => prevIndex + 1)}
                            >
                              <Icon name="step-forward" size={18} color="white" />
                            </TouchableOpacity>
                          )} */}
                        </View>

                        {/* Time Display */}
                        <View style={styles.timeDisplay}>
                          <Text style={styles.timeText}>
                            {isSeeking ? formatTime(seekValue) : formatTime(currentTime)} / {formatTime(duration)}
                          </Text>
                        </View>

                        {/* Settings Button */}
                        <View style={styles.settingsContainer}>
                          <TouchableOpacity style={styles.circleButton}>
                            <Icon name="cog" size={20} color="white" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.circleButton}
                            onPress={toggleMiniPlayerMode}
                          >
                            <Icon name="compress" size={18} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </SafeAreaView>
          </PanGestureHandler>
        </GestureHandlerRootView>
      )}

      {/* Video Details Modal */}
      <Modal
        visible={showDetails}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseDetails}
      >
        <SafeAreaView style={styles.detailsContainer}>

          {/* Top 40% Section with Back Icon and Video Logo */}
          <View style={styles.detailsTopSection}>
            {/* Header with Back Icon */}
            <TouchableOpacity style={styles.backButton} onPress={handleCloseDetails}>
              <Icon name="arrow-left" size={28} color="white" />
            </TouchableOpacity>

            {/* Video Icon */}
            <View style={styles.detailsVideoIcon}>
              <Icon name="video-camera" size={100} color="#A020F0" />
            </View>
          </View>

          {/* Bottom 60% Details  */}
          <ScrollView style={styles.detailsBottomSection}>
            <Text style={styles.detailTitle}>
              {videoFiles[currentVideoIndex]?.name || 'Unknown Video'}
            </Text>

            {/* Video Size */}
            <View style={styles.detailContainer}>
              <Icon name="film" size={30} color="#777" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailItemBold}>{videoFiles[currentVideoIndex]?.name || 'Unknown Video'}</Text>
                <Text style={styles.detailItemBold}>{videoDetails?.size} MB . {videoDetails?.duration || "Unknown"}</Text>
              </View>
            </View>

            {/* Modified Date */}
            <View style={styles.detailContainer}>
              <Icon name="calendar" size={30} color="#777" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailItemBold}>Modified {videoDetails?.modifiedDate}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 0,
  },
  videoControlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  videoBackButton: {
    padding: 10,
  },
  videoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    flex: 1,
  },
  centerPlayButton: {
    alignSelf: 'center',
    padding: 15,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoControlsFooter: {
    marginBottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  progressContainer: {
    paddingHorizontal: 5,
    paddingVertical: 0,
  },
  slider: {
    width: '100%',
    height: 60,
  },
  controlsTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
  },
  settingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  swipeIndicatorText: {
    color: 'white',
    marginTop: 5,
  },
  optionsContainer: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
    textAlign: 'left',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#202020', //black
  },
  detailsTopSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'gray',
  },
  detailsVideoIcon: {
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 10,
    right: 1,
    width: 409,
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  miniPlayerVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    resizeMode: 'contain',
  },



  miniPlayerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  miniPlayerExpand: {
    padding: 5,
  },
  miniPlayerClose: {
    padding: 5,
  },
  miniPlayerVideoContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  miniPlayerProgressContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  miniPlayerSlider: {
    width: '100%',
    height: 40,
  },
  miniPlayerControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  miniPlayerTimeText: {
    color: 'white',
    fontSize: 12,
  },
  miniPlayerButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerControlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
});

export default VideoPlayerModal;
