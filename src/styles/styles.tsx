import { StyleSheet, Dimensions } from 'react-native';

const {height: SCREEN_HEIGHT } = Dimensions.get('window')

const styles = StyleSheet.create({

  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    paddingLeft: 10,
  },
  noFiles: {
    textAlign: 'center',
    fontSize: 20,
    color: '#aaa',
    marginTop: 30,
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  imageTitleName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    // textAlign: 'center',
    paddingLeft: 20,
    paddingRight: 20
  },
  closeIconContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  imageViewerFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  imageIndexFooter: {
    color: 'white',
    fontSize: 18,
  },
  detailsIconContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40, 
    height: 5, 
    backgroundColor: '#E0E0E0', 
    alignSelf: 'center', 
    borderRadius: 2.5,
    marginTop: 10,
    marginBottom: 10
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ff5e57',
  },
  placeholder: {
    width: 60, // Placeholder to align header elements
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  detailsContainer: {
    marginVertical: 25,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#666',
  },
  sectionValue: {
    fontSize: 16,
    color: '#333',
  },
  horizontalBar: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android-specific shadow
  },
  searchIcon: {
    marginRight: 5,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  storageBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  storageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  storageUsed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007aff',
  },
  storageTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryBox: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },

  audioPlayerContainer: {
    backgroundColor: '#333',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    height: 200
  },
  audioPlayerTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 15,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    width: '80%', // Adjust width to space out icons
  },
  audioTime: {
    color: 'white',
    fontSize: 16,
    marginVertical: 10,
  },
  videoPlayerContainer: {
    backgroundColor: '#333',
    padding: 24,
    borderRadius: 15,
    alignItems: 'center',
    width: '90%',
    height: 350,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },

  // Add these to your styles.js file if they don't exist
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  folderInfoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  fileCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    paddingLeft: 10,
  },
  overlay: {
    // flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    // justifyContent: 'flex-end',
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fileDetailsBottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 20,
  },
  scrollableContent: {
    flex: 1,
  },

  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: 'green',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },


  bottomsheet_container: {
    width: '100%',
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    position: 'absolute',
    top: SCREEN_HEIGHT / 1.5,
    zIndex: 12000,
    borderRadius: 25,
    paddingHorizontal: 10
},
line: {
    width: 75,
    height: 4,
    backgroundColor: 'black',
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 10,
},  
backdropContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
});

export default styles;
