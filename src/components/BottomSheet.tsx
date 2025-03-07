// src/components/BottomSheet.tsx

// import { Dimensions, StyleSheet, Text, View, StyleProp, ViewStyle, Modal, TouchableOpacity, ScrollView, StatusBar, TouchableWithoutFeedback } from 'react-native'
// import React, { useState } from 'react'
// import styles from '../styles/styles';
// import { Gesture, GestureDetector } from 'react-native-gesture-handler'
// import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window')
// const MAX_TRANSLATE_Y = SCREEN_HEIGHT / 1.5
// const MIN_TRANSLATE_Y = SCREEN_HEIGHT / 5

// interface BottomSheetProps {
//   // children: React.ReactNode;
//   onDismiss?: () => void;
//   visible: boolean;
//   containerStyle?: StyleProp<ViewStyle>;
//   fileDetails?: any;
// }

// export default function BottomsheetModal({ onDismiss, visible, containerStyle, fileDetails }: BottomSheetProps) {

//   const [modalVisible, setModalVisible] = useState(false);

//   const translateY = useSharedValue(0)
//   const context = useSharedValue({ y: 0 })

//   const gesture = Gesture.Pan()
//     .onStart(e => {
//       context.value = { y: translateY.value }
//     })
//     .onUpdate(e => {
//       translateY.value = e.translationY + context.value.y;
//       translateY.value = Math.max(translateY.value, -MAX_TRANSLATE_Y)
//     })
//     .onEnd(e => {
//       if (translateY.value > -MIN_TRANSLATE_Y) {
//         translateY.value = withSpring(SCREEN_HEIGHT)
//       }
//       if (translateY.value < -MIN_TRANSLATE_Y) {
//         translateY.value = withSpring(-MAX_TRANSLATE_Y)
//       }
//     })
  
//   /**
//    * Scrolls to a specific destination
//    * @param {number} destination - The destination to scroll to
//    */
//   // const scrollTo = (destination: number) => {
//   //   'worklet'
//   //   translateY.value = withSpring(destination, { damping: 50 })
//   // }

//   // useEffect(() => {
//   //   // Initial scroll to show the bottom sheet partially
//   //   scrollTo(-SCREEN_HEIGHT / 3)
//   // }, [])

//   console.log("visisble in bototm sheet: ", visible)
//   // useEffect(() => {
//   //   if (visible) {
//   //     scrollTo(-SCREEN_HEIGHT / 3);
//   //   } else {
//   //     scrollTo(SCREEN_HEIGHT); // Hide when not visible
//   //   }
//   // }, [visible]);

//   const openBottomSheet = () => {
//     translateY.value = withSpring(-SCREEN_HEIGHT / 2, { damping: 50 });
//   };

//   const closeBottomSheet = () => {
//     translateY.value = withSpring(SCREEN_HEIGHT);
//   };


//   const rBottomSheetStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ translateY: translateY.value }],
//     };
//   });

//   const openModal = () => {
//     setModalVisible(true);
//     // Reset bottom sheet position when modal opens
//     translateY.value = SCREEN_HEIGHT;
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//   };

//   return visible ? 
//   // (
//     // <Modal
//     //   transparent
//     //   // visible={visible}
//     //   animationType="fade"
//     //   onRequestClose={onDismiss}
//     //   >
//   //     <GestureDetector gesture={gesture}>
//   //       <Animated.View style={[
//   //         styles.bottomsheet_container,
//   //         rBottomSheetStyle,
//   //         // containerStyle,
//   //         // visible ? { display: 'flex' } : { display: 'none' },
//   //       ]}>
//   //         <View style={styles.line} />
//           // <ScrollView
//           //   style={styles.scrollableContent}
//           //   contentContainerStyle={styles.scrollContentContainer}
//           // >
//   //           <View style={styles.header}>
//   //             <Text style={styles.headerTitle}>Details</Text>
//   //           </View>
//   //           <View style={styles.detailsContainer}>
//   //             <View style={styles.detailsSection}>
//   //               <Text style={styles.sectionLabel}>Name</Text>
//   //               <Text style={styles.sectionValue}>{fileDetails?.fileName}</Text>
//   //             </View>
//   //             <View style={styles.horizontalBar} />
//   //             <View style={styles.detailsSection}>
//   //               <Text style={styles.sectionLabel}>Time</Text>
//   //               <Text style={styles.sectionValue}>{fileDetails?.lastModified}</Text>
//   //             </View>
//   //             <View style={styles.horizontalBar} />
//   //             <View style={styles.detailsSection}>
//   //               <Text style={styles.sectionLabel}>Dimensions</Text>
//   //               <Text style={styles.sectionValue}>{fileDetails?.dimensions}</Text>
//   //             </View>
//   //             <View style={styles.horizontalBar} />
//   //             <View style={styles.detailsSection}>
//   //               <Text style={styles.sectionLabel}>Size</Text>
//   //               <Text style={styles.sectionValue}>{fileDetails?.size} MB</Text>
//   //             </View>
//   //             <View style={styles.horizontalBar} />
//   //             <View style={styles.detailsSection}>
//   //               <Text style={styles.sectionLabel}>Path</Text>
//   //               <Text style={styles.sectionValue} numberOfLines={2} ellipsizeMode="middle">
//   //                 {fileDetails?.filePath}
//   //               </Text>
//   //             </View>
//   //           </View>
//   //         </ScrollView>
//   //       </Animated.View>
//   //     </GestureDetector>
//   //   </Modal>
//   // ) 
//   (
//     <GestureHandlerRootView style={styles.container}>
  
//       <TouchableOpacity style={styles.button} onPress={openBottomSheet}>
//           <Text style={styles.buttonText}>Open</Text>
//       </TouchableOpacity>

//       <Modal
//       transparent
//       // visible={visible}
//       animationType="fade"
//       onRequestClose={onDismiss}
//       > 
//         <View style={styles.modalContainer}>
//         <Text style={styles.modalTitle}>Modal Content</Text>

//         {/* Button to open bottom sheet inside modal */}
//         <TouchableOpacity style={styles.button} onPress={openBottomSheet}>
//             <Text style={styles.buttonText}>Open Bottom Sheet</Text>
//         </TouchableOpacity>

//         {/* Button to close modal */}
//         <TouchableOpacity style={styles.closeModalButton} onPress={closeModal}>
//             <Text style={styles.buttonText}>Close Modal</Text>
//         </TouchableOpacity>

//           <GestureDetector gesture={gesture}>
//             <Animated.View style={[styles.bottomsheet_container, rBottomSheetStyle]}>
//                 <View style={styles.line} />
//                 <Text style={styles.buttonText}>Bottom Sheet</Text>
    
//                 {/* Close button inside bottom sheet */}
//               <TouchableOpacity style={styles.closeButton} onPress={closeBottomSheet}>
//                 <Text style={styles.buttonText}>Close</Text>
//               </TouchableOpacity>
//             </Animated.View>
//         </GestureDetector>
//         </View>
//       </Modal>
//     </GestureHandlerRootView>
//   )
//   : null;
// }


import { Dimensions, StyleSheet, Text, View, StyleProp, ViewStyle, Modal, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAX_TRANSLATE_Y = SCREEN_HEIGHT / 1.5
const MIN_TRANSLATE_Y = SCREEN_HEIGHT / 10

interface BottomSheetProps {
  onDismiss?: () => void;
  visible: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  fileDetails?: any;
}

export default function BottomsheetModal({ onDismiss, visible, containerStyle, fileDetails }: BottomSheetProps) {
  // Initialize translateY with SCREEN_HEIGHT to start off-screen
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const context = useSharedValue({ y: 0 })

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
        console.log("here in first if: and visible value", visible)
        visible = false
        console.log("visible value now:", visible)
      }
      if (translateY.value < -MIN_TRANSLATE_Y) {
        translateY.value = withSpring(-MAX_TRANSLATE_Y)
        console.log("here in second if")
      }
      
    })

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Function to open the bottom sheet
  const openBottomSheet = () => {
    translateY.value = withSpring(-SCREEN_HEIGHT / 3, { damping: 50 });
  };

  // Function to close the bottom sheet
  const closeBottomSheet = () => {
    translateY.value = withSpring(SCREEN_HEIGHT);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Open the bottom sheet when the component becomes visible
  useEffect(() => {
    if (visible) {
      console.log("visible value now in useeffect if visible is true:", visible)
      openBottomSheet();
    } else {
      console.log("visible value now in useeffect else visible is false:", visible)
      closeBottomSheet();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
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
              <TouchableOpacity style={styles.closeButton} onPress={closeBottomSheet}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>

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
    marginBottom: 20,
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
    alignItems: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});