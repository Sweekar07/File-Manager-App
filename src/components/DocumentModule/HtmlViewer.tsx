// src/components/DocumentModule/HtmlViewer.tsx

import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, SafeAreaView, Text, StyleSheet, StatusBar, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import RenderHtml, { HTMLElementModel, HTMLContentModel } from 'react-native-render-html';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';

interface HtmlViewerProps {
  visible: boolean;
  filePath: string;
  onClose: () => void;
  fileName: string;
}

const HtmlViewer: React.FC<HtmlViewerProps> = ({ visible, filePath, onClose, fileName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    const loadHtmlContent = async () => {
      try {
        const path = filePath.replace('file://', '');
        const content = await RNFS.readFile(path, 'utf8');
        console.log("HTML content loaded");
        setHtmlContent(content);
        setError(null);
      } catch (err) {
        console.error('Error loading HTML file:', err);
        setError('Failed to load HTML file');
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      setIsLoading(true); // reset loading state
      loadHtmlContent();
    }
  }, [filePath, visible]);

  // Define custom models for deprecated HTML tags
  const customHTMLElementModels = {
    center: HTMLElementModel.fromCustomModel({
      tagName: 'center',
      contentModel: HTMLContentModel.block,
      getReactNativeStyle: () => ({ 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      })
    }),
    font: HTMLElementModel.fromCustomModel({
      tagName: 'font',
      contentModel: HTMLContentModel.textual
    }),
    marquee: HTMLElementModel.fromCustomModel({
      tagName: 'marquee',
      contentModel: HTMLContentModel.block
    }),
    // Add other deprecated tags that might appear in your HTML files
    blink: HTMLElementModel.fromCustomModel({
      tagName: 'blink',
      contentModel: HTMLContentModel.textual
    }),
    strike: HTMLElementModel.fromCustomModel({
      tagName: 'strike',
      contentModel: HTMLContentModel.textual,
      getReactNativeStyle: () => ({
        textDecorationLine: 'line-through'
      })
    })
  };

  // Custom renderer for handling images with modern parameter defaults
  const renderers = {
    // Using function with ES6 destructuring and default parameters
    img: ({ TDefaultRenderer, tnode, ...props }: any) => {
      // Use safe access and default values
      const attributes = tnode?.attributes || {};
      const { src = '', alt = '' } = attributes;
      
      return (
        <View style={{ width: '100%' }}>
          <TDefaultRenderer
            tnode={tnode}
            {...props}
            style={{ width: '100%', height: 'auto' }}
          />
          {alt ? (
            <Text style={{ textAlign: 'center', fontSize: 12, color: '#666' }}>
              {alt}
            </Text>
          ) : null}
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#f8f8f8" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {fileName}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="times" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading HTML file...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-triangle" size={50} color="#ff6347" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView style={styles.htmlContainer}>
            <RenderHtml
              contentWidth={width - 20} // Account for padding
              source={{ html: htmlContent || '<h1>No content found</h1>' }}
              tagsStyles={htmlStyles}
              customHTMLElementModels={customHTMLElementModels}
              renderers={renderers}
              defaultTextProps={{ selectable: true }}
              // Handle legacy HTML tags
              ignoredDomTags={[]} // Don't ignore any tags by default
              // Error handling for images
              renderersProps={{
                img: {
                  enableExperimentalPercentWidth: true,
                  initialDimensions: { width: width - 20, height: 200 },
                }
              }}
              onHTMLLoaded={() => console.log("HTML loaded successfully")}
              enableExperimentalMarginCollapsing={true}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 60,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0000ff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  htmlContainer: {
    flex: 1,
    padding: 10,
  },
});

const htmlStyles = {
  p: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  a: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  img: {
    maxWidth: '100%',
  },
   // Add legacy tag styles
   center: {
    textAlign: 'center',
    alignItems: 'center',
  },
  font: {
    // Default font styling
  },
  strike: {
    textDecorationLine: 'line-through',
  }
  // Add more styles as needed
};

export default HtmlViewer;
