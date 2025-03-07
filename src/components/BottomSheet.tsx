// src/components/BottomSheet.tsx

import { Dimensions, StyleSheet, Text, View, StyleProp, ViewStyle, Modal, TouchableOpacity, ScrollView, StatusBar, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect } from 'react'
import styles from '../styles/styles';
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAX_TRANSLATE_Y = SCREEN_HEIGHT / 1.5
const MIN_TRANSLATE_Y = SCREEN_HEIGHT / 5

interface BottomSheetProps {
  // children: React.ReactNode;
  onDismiss?: () => void;
  visible: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  fileDetails?: any;
}

export default function BottomsheetModal({ onDismiss, visible, containerStyle, fileDetails }: BottomSheetProps) {
  const translateY = useSharedValue(0)
  const context = useSharedValue({ y: 0 })

  const gesture = Gesture.Pan()
    .onStart(e => {
      context.value = { y: translateY.value }
    })
    .onUpdate(e => {
      translateY.value = e.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, -MAX_TRANSLATE_Y)
    })
    .onEnd(e => {
      if (translateY.value > -MIN_TRANSLATE_Y) {
        translateY.value = withSpring(SCREEN_HEIGHT)
      }
      if (translateY.value < -MIN_TRANSLATE_Y) {
        translateY.value = withSpring(-MAX_TRANSLATE_Y)
      }
    })
  
  /**
   * Scrolls to a specific destination
   * @param {number} destination - The destination to scroll to
   */
  const scrollTo = (destination: number) => {
    'worklet'
    translateY.value = withSpring(destination, { damping: 50 })
  }

  // useEffect(() => {
  //   // Initial scroll to show the bottom sheet partially
  //   scrollTo(-SCREEN_HEIGHT / 3)
  // }, [])

  console.log("visisble in bototm sheet: ", visible)
  useEffect(() => {
    if (visible) {
      scrollTo(-SCREEN_HEIGHT / 3);
    } else {
      scrollTo(SCREEN_HEIGHT); // Hide when not visible
    }
  }, [visible]);


  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return visible ? (
    <Modal
      transparent
      // visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      >
      <GestureDetector gesture={gesture}>
        <Animated.View style={[
          styles.bottomsheet_container,
          rBottomSheetStyle,
          // containerStyle,
          // visible ? { display: 'flex' } : { display: 'none' },
        ]}>
          <View style={styles.line} />
          <ScrollView
            style={styles.scrollableContent}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Details</Text>
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
    </Modal>
  ) : null;
}
