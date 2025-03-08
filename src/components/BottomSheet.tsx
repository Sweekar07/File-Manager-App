// src/components/BottomSheet.tsx

import { Dimensions, StyleSheet, Text, View, StyleProp, ViewStyle, Modal, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAX_TRANSLATE_Y = SCREEN_HEIGHT / 1.5
const MIN_TRANSLATE_Y = SCREEN_HEIGHT / 5

interface BottomSheetProps {
  onDismiss?: () => void;
  visible: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  fileDetails?: any;
}

export default function BottomsheetModal({ onDismiss, visible, containerStyle, fileDetails }: BottomSheetProps) {
  
  // Local state to track if the sheet should dismiss itself
  const [shouldDismiss, setShouldDismiss] = useState(false)
  
  // Initialize translateY with SCREEN_HEIGHT to start off-screen
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const context = useSharedValue({ y: 0 })
  
  // Function to handle dismissal that can be called from the worklet
  const handleDismiss = () => {
    setShouldDismiss(true)
  }
  
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value }
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, -MAX_TRANSLATE_Y)
    })
    .onEnd(() => {
      if (translateY.value > -MIN_TRANSLATE_Y) {
        translateY.value = withSpring(SCREEN_HEIGHT)
        // Using runOnJS to call a JS function from a worklet
        runOnJS(handleDismiss)()
      }
    })
    
  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  /**
   * Scrolls to a specific destination
   * @param {number} destination - The destination to scroll to
   */
  const scrollTo = (destination: number) => {
    'worklet'
    translateY.value = withSpring(destination, {damping: 50})
  }
  
  // Function to close the bottom sheet
  const closeBottomSheet = () => {
    translateY.value = withSpring(SCREEN_HEIGHT);
    setShouldDismiss(true)
  };

  // Effect to handle opening the sheet when visible changes to true
  useEffect(() => {
    if (visible) {
      console.log("visible value now in useeffect if visible is true:", visible)
      // Reset the dismiss state
      setShouldDismiss(false)
      // Initial scroll to show the bottom sheet partially
      scrollTo(-SCREEN_HEIGHT / 3)
    }    
  }, [visible])
  
  // Effect to handle closing via onDismiss when shouldDismiss changes
  useEffect(() => {
    if (shouldDismiss && onDismiss) {
      onDismiss()
    }
  }, [shouldDismiss, onDismiss])

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        closeBottomSheet()
      }}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayBackground} 
          activeOpacity={1} 
          onPress={closeBottomSheet}
        />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[
            styles.bottomSheetContainer,
            rBottomSheetStyle,
            containerStyle,
          ]}>
            <View style={styles.line} />
            
            <ScrollView
              style={styles.scrollableContent}
              contentContainerStyle={styles.scrollContentContainer}
            >

              <View style={styles.header}>
                <Text style={styles.headerTitle}>Details</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeBottomSheet}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Name</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.fileName}</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Time</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.lastModified}</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Dimensions</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.dimensions}</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Size</Text>
                  <Text style={styles.sectionValue}>{fileDetails?.size} MB</Text>
                </View>
                <View style={styles.horizontalBar} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Path</Text>
                  <Text style={styles.sectionValue} numberOfLines={2} ellipsizeMode="middle">
                    {fileDetails?.filePath}
                  </Text>
                </View>
              </View>
            
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  bottomSheetContainer: {
    width: '100%',
    height: SCREEN_HEIGHT / 1.5,
    backgroundColor: 'white',
    position: 'absolute',
    top: SCREEN_HEIGHT,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    zIndex: 1000,
  },
  line: {
    width: 75,
    height: 4,
    backgroundColor: 'gray',
    alignSelf: 'center',
    marginVertical: 15,
    borderRadius: 10,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 15,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  sectionValue: {
    fontSize: 16,
    maxWidth: '60%',
  },
  horizontalBar: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  closeButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,

  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});