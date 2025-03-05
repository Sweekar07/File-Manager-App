import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  View, 
  TouchableOpacity, 
  Animated, 
  PanResponder, 
  Dimensions, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import styles from '../styles/styles';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  height?: number;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onDismiss,
  children,
  containerStyle,
  height = 300
}) => {
  const screenHeight = Dimensions.get('screen').height;
  const panY = useRef(new Animated.Value(screenHeight)).current;

  // Animations
  const resetPositionAnim = Animated.timing(panY, {
    toValue: screenHeight - height,
    duration: 300,
    useNativeDriver: true
  });

  const closeAnim = Animated.timing(panY, {
    toValue: screenHeight,
    duration: 300,
    useNativeDriver: true
  });

  // Pan Responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dy: panY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        // Dismiss if swiped down significantly
        if (gestureState.dy > 50 && gestureState.vy > 1) {
          handleDismiss();
        } else {
          // Reset to original position
          Animated.spring(panY, {
            toValue: screenHeight - height,
            bounciness: 0,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  // Effect to handle modal visibility
  useEffect(() => {
    if (visible) {
      Animated.spring(panY, {
        toValue: screenHeight - height,
        bounciness: 5,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    closeAnim.start(() => {
      onDismiss();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={handleDismiss}
      >
        <Animated.View
          style={[
            styles.container, 
            containerStyle,
            { 
              transform: [{ translateY: panY }] 
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle}
          />
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default BottomSheet;