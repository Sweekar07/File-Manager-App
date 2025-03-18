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
  StyleSheet 
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome';
import { 
  PanGestureHandler, 
  State, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';

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
  
  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoFileDetails | null>(null);

  const videoRef = useRef<VideoRef>(null);
  const { width: screenWidth } = Dimensions.get('window');
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [videoDuration, setVideoDuration] = useState<string | null>(null);


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
  
      setVideoDetails({ size: sizeInMB, modifiedDate: finalFormattedDate, duration: videoDuration || "Unknown"  });
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
    setCurrentTime(data.currentTime);
  }, []);

  // Handle video load event
  const handleLoad = useCallback((data: { duration: number }) => {
    const formattedDuration = formatTime(data.duration);
    setVideoDuration(formattedDuration);
    setDuration(data.duration);
  }, []);

  // Handle swipe gestures for navigating between videos
  const handleSwipe = useCallback((event: any) => {
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
  }, [currentVideoIndex, screenWidth, videoFiles.length]);

  // Render swipe indicator when user is swiping
  const renderSwipeIndicator = useCallback(() => {
    if (!isSwipeActive || Math.abs(swipeDistance) < 50) return null;
    
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
  }, [isSwipeActive, swipeDistance, currentVideoIndex, videoFiles.length]);

  // Show file info modal
  const handleShowFileInfo = useCallback(() => {
    const currentUri = getCurrentVideoUri().replace('file://', '');
    getVideoFileDetails(currentUri);
  }, [getCurrentVideoUri, getVideoFileDetails]);

  // Close details modal and reset to player
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
  }, []);

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
  }, [currentVideoIndex]);

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onRequestClose}>
      <StatusBar hidden />
      <GestureHandlerRootView style={styles.fullScreenContainer}>
        <PanGestureHandler onGestureEvent={handleSwipe} onHandlerStateChange={handleSwipe}>
          <View style={styles.fullScreenContainer}>
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
                    style={styles.playPauseButton}
                  >
                    <Icon name={isPlaying ? "pause" : "play"} size={40} color="white" />
                  </TouchableOpacity>
                  
                  {/* Bottom controls */}
                  <View style={styles.videoControlsFooter}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                    
                    <View style={styles.controlButtonsRow}>
                      {videoFiles.length > 1 && currentVideoIndex > 0 && (
                        <TouchableOpacity 
                          style={styles.controlButton}
                          onPress={() => setCurrentVideoIndex(prevIndex => prevIndex - 1)}
                        >
                          <Icon name="step-backward" size={20} color="white" />
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={styles.controlButton}
                        onPress={skipBackward}
                      >
                        <View style={styles.skipButtonContent}>
                          <Icon name="backward" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.playButton}
                        onPress={togglePlayPause}
                      >
                        <Icon name={isPlaying ? "pause" : "play"} size={24} color="white" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.controlButton}
                        onPress={skipForward}
                      >
                        <View style={styles.skipButtonContent}>
                          <Icon name="forward" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
                      
                      {videoFiles.length > 1 && currentVideoIndex < videoFiles.length - 1 && (
                        <TouchableOpacity 
                          style={styles.controlButton}
                          onPress={() => setCurrentVideoIndex(prevIndex => prevIndex + 1)}
                        >
                          <Icon name="step-forward" size={20} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {videoFiles.length > 0 && (
                      <Text style={styles.videoCounter}>
                        {currentVideoIndex + 1} / {videoFiles.length}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </PanGestureHandler>
      </GestureHandlerRootView>

      {/* Video Details Modal */}
      <Modal 
        visible={showDetails} 
        transparent={false} 
        animationType="slide" 
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.detailsContainer}>

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
          <View style={styles.detailsBottomSection}>
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
          </View>
        </View>
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
    padding: 20,
  },
  videoControlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
  playPauseButton: {
    alignSelf: 'center',
    padding: 15,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoControlsFooter: {
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlButton: {
    padding: 10,
    marginHorizontal: 8,
  },
  playButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    marginHorizontal: 20,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoCounter: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
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
});

export default VideoPlayerModal;