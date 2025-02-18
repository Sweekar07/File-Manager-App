// src/components/ImageViewerModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, Animated, PanResponder, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import ImageViewing from 'react-native-image-viewing';
import RNFS from 'react-native-fs';
import styles from '../styles/styles';

interface ImageViewerModalProps {
  visible: boolean;
  images: { uri: string }[];
  initialIndex: number;
  onRequestClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ visible, images, initialIndex, onRequestClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [fileDetails, setFileDetails] = useState<{
    size: string;
    lastModified: string;
    fileName: string;
    filePath: string;
    dimensions: string;
  } | null>(null);

  const pan = useRef(new Animated.ValueXY()).current; // For drag gesture tracking
  const modalHeight = useRef(new Animated.Value(1)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  const isScrolling = useRef(false);
  const lastScrollY = useRef(0);

  const closeDetailsModal = () => {
    // setDetailsVisible(false);
    Animated.parallel([
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(modalHeight, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => setDetailsVisible(false));
  };  

  const closeModal = () => {
    setDetailsVisible(false);
    modalTranslateY.setValue(0);
    modalHeight.setValue(1);
    setCurrentIndex(0);
    setFileDetails(null);
    onRequestClose();
  };

  // Reset pan value when modal opens
  useEffect(() => {
    if (isDetailsVisible) {
      pan.setValue({ x: 1, y: 0 });
    }
  }, [isDetailsVisible]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex); // Reset index when modal opens
    }
  }, [visible, initialIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationY } = evt.nativeEvent;
        // Only respond to touches in the drag handle area
        return locationY < 60;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { locationY } = evt.nativeEvent;
        const isDraggingDown = gestureState.dy > 0;
        const isSignificantDrag = Math.abs(gestureState.dy) > 5;
        const isInDragArea = locationY < 60;
        
        // If we're actively scrolling, don't intercept
        if (isScrolling.current && !isInDragArea) {
          return false;
        }
  
        // Allow drag if:
        // 1. Touch started in drag handle area
        // 2. OR we're at the top of scroll AND dragging down
        return (
          isInDragArea ||
          (scrollOffset.current <= 0 && isDraggingDown && isSignificantDrag)
        );
      },
      onPanResponderGrant: () => {
        isScrolling.current = false;
        lastScrollY.current = scrollOffset.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow downward drag when at the top of the scroll
          if (scrollOffset.current <= 0) {
            modalTranslateY.setValue(gestureState.dy);
            const opacity = Math.max(0.5, 1 - (gestureState.dy / 400));
            modalHeight.setValue(opacity);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 && !isScrolling.current) {
          closeDetailsModal();
        } else {
          // Spring back animation
          Animated.parallel([
            Animated.spring(modalTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 8,
              speed: 12,
            }),
            Animated.timing(modalHeight, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
        isScrolling.current = false;
      },
    })
  ).current;

  const showFileDetails = async (imageUri: string) => {
    const filePath = imageUri.replace('file://', '');
    const stats = await RNFS.stat(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const lastModifiedDate = new Date(stats.mtime);
    const fileName = filePath.split('/').pop();
    const day = lastModifiedDate.getDate().toString().padStart(2, '0');
    const month = (lastModifiedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = lastModifiedDate.getFullYear();
    const minutes = lastModifiedDate.getMinutes().toString().padStart(2, '0');
    const seconds = lastModifiedDate.getSeconds().toString().padStart(2, '0');
    const ampm = lastModifiedDate.getHours() >= 12 ? 'PM' : 'AM';
    let hours12 = lastModifiedDate.getHours() % 12;
    hours12 = hours12 ? hours12 : 12;
    const lastModified = `${day}/${month}/${year} ${hours12}:${minutes}:${seconds} ${ampm}`;
    const dimensions = await Image.getSize(imageUri);

    setFileDetails({
      size: sizeInMB,
      lastModified,
      fileName: fileName || '',
      filePath,
      dimensions: `${dimensions.width} × ${dimensions.height} Pixels`,
    });
    setDetailsVisible(true);
    modalTranslateY.setValue(0);
    modalHeight.setValue(1);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={closeModal}>
      <ImageViewing
        images={images}
        imageIndex={currentIndex}
        visible={visible}
        onRequestClose={closeModal}
        onImageIndexChange={(index) => {
          console.log("Image Swiped to Index:", index); // Debugging
          setCurrentIndex(index);
        }}
        HeaderComponent={({ imageIndex }) => (
          <View style={styles.imageViewerHeader}>
            <View style={styles.detailsIconContainer}>
              <TouchableOpacity onPress={() => showFileDetails(images[imageIndex].uri)}>
                <Icon name="info-circle" size={30} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.imageTitleName}>{images[imageIndex].uri.split('/').pop()}</Text>
            <TouchableOpacity style={styles.closeIconContainer} onPress={closeModal}>
              <Icon name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
      <Modal visible={isDetailsVisible} animationType="none" transparent={true} onRequestClose={closeDetailsModal}>
        <Pressable style={styles.modalOverlay} onPress={closeDetailsModal}>
          <Animated.View style={[
            styles.detailsContent,
            {
              transform: [{ translateY: modalTranslateY }],
              opacity: modalHeight,
            }
          ]}
          {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={closeDetailsModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Details</Text>
              <View style={styles.placeholder} />
            </View>
            <ScrollView style={styles.scrollableContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={true} bounces={true}
              onScrollBeginDrag={() => {
                isScrolling.current = true;
              }}
              onScrollEndDrag={() => {
                isScrolling.current = false;
              }}
              onScroll={(e) => {
                scrollOffset.current = e.nativeEvent.contentOffset.y;
                lastScrollY.current = scrollOffset.current;
              }}
              scrollEventThrottle={16}>
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
                  <Text style={styles.sectionValue}>{fileDetails?.filePath}</Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </Modal>
  );
};

export default ImageViewerModal;
