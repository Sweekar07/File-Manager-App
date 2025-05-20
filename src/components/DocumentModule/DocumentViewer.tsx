// src/components/DocumentModule/DocumentViewer.tsx

import React from 'react';
import HtmlViewer from './HtmlViewer';
// import PDFViewer from './PDFViewer';
// import TextViewer from './TextViewer';
// import GenericDocViewer from './GenericDocViewer';

interface DocumentViewerProps {
  visible: boolean;
  filePath: string;
  fileName: string;
  onClose: () => void;
}

/**
 * Main DocumentViewer component that routes to the appropriate
 * viewer based on the file extension
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({ visible, filePath, fileName, onClose }) => {
  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  };

  // Determine which viewer to use based on the file extension
  const renderDocumentViewer = () => {
    const extension = getFileExtension(fileName);
    
    switch (extension) {
      case 'html':
      case 'htm':
        return (
          <HtmlViewer
            visible={visible}
            filePath={filePath}
            fileName={fileName}
            onClose={onClose}
          />
        );
      
    //   case 'pdf':
    //     return (
    //       <PDFViewer
    //         visible={visible}
    //         filePath={filePath}
    //         fileName={fileName}
    //         onClose={onClose}
    //       />
    //     );
      
    //   case 'txt':
    //     return (
    //       <TextViewer
    //         visible={visible}
    //         filePath={filePath}
    //         fileName={fileName}
    //         onClose={onClose}
    //       />
    //     );
      
      // Add other specific viewers as needed
      default:
        // Use a generic document viewer for unsupported document types
        // return (
        //   <GenericDocViewer
        //     visible={visible}
        //     filePath={filePath}
        //     fileName={fileName}
        //     fileType={extension}
        //     onClose={onClose}
        //   />
        // );
        return (
            <HtmlViewer
            visible={visible}
            filePath={filePath}
            fileName={fileName}
            onClose={onClose}
          />
        )
    }
  };

  return renderDocumentViewer();
};

export default DocumentViewer;
