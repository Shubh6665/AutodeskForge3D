import React, { useEffect, useRef, useState } from 'react';
import './ForgeViewer.css';

declare global {
  interface Window {
    Autodesk: any;
  }
}

interface ForgeViewerProps {
  accessToken: string;
  urn: string;
}

const ForgeViewer: React.FC<ForgeViewerProps> = ({ accessToken, urn }) => {
  const viewerContainer = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerContainer.current || !accessToken || !urn) return;

    const initializeViewer = () => {
      const { Autodesk } = window;
      
      if (!Autodesk || !Autodesk.Viewing) {
        setError('Forge Viewer SDK not loaded');
        return;
      }

      const options = {
        env: 'AutodeskProduction',
        getAccessToken: (callback: (token: string, expire: number) => void) => {
          callback(accessToken, 3600);
        }
      };

      Autodesk.Viewing.Initializer(options, () => {
        const config = {
          extensions: ['Autodesk.DefaultTools.NavTools'],
        };

        const viewerInstance = new Autodesk.Viewing.GuiViewer3D(
          viewerContainer.current,
          config
        );

        const startedCode = viewerInstance.start();
        if (startedCode > 0) {
          setError('Failed to create a Viewer: WebGL not supported.');
          return;
        }

        console.log('Viewer initialized successfully');
        setViewer(viewerInstance);

        // Load the document
        const documentId = `urn:${urn}`;
        Autodesk.Viewing.Document.load(
          documentId,
          (doc: any) => {
            const viewables = doc.getRoot().getDefaultGeometry();
            if (viewables) {
              viewerInstance.loadDocumentNode(doc, viewables).then(() => {
                console.log('Model loaded successfully');
                setIsLoading(false);
              });
            } else {
              setError('No viewable content found');
              setIsLoading(false);
            }
          },
          (errorCode: any) => {
            console.error('Document load error:', errorCode);
            setError(`Failed to load document: ${errorCode}`);
            setIsLoading(false);
          }
        );
      });
    };

    // Load Forge Viewer SDK
    if (!window.Autodesk) {
      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      script.onload = initializeViewer;
      script.onerror = () => setError('Failed to load Forge Viewer SDK');
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);
    } else {
      initializeViewer();
    }

    return () => {
      if (viewer) {
        viewer.finish();
      }
    };
  }, [accessToken, urn]);

  // Toolbar Functions
  const fitToView = () => {
    if (viewer) viewer.fitToView();
  };

  const isolateSelection = () => {
    if (viewer) {
      const selection = viewer.getSelection();
      if (selection.length > 0) {
        viewer.isolate(selection);
      }
    }
  };

  const showAll = () => {
    if (viewer) viewer.showAll();
  };

  const explodeModel = () => {
    if (viewer) {
      const explodeScale = viewer.getExplodeScale();
      viewer.explode(explodeScale > 0 ? 0 : 0.5);
    }
  };

  const toggleWireframe = () => {
    if (viewer) {
      const renderMode = viewer.getRenderMode();
      viewer.setRenderMode(renderMode === 0 ? 1 : 0);
    }
  };

  if (error) {
    return (
      <div className="forge-viewer-error">
        <h3>Error Loading Viewer</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  return (
    <div className="forge-viewer-container">
      {/* Custom Toolbar */}
      <div className="forge-toolbar">
        <div className="toolbar-group">
          <button onClick={fitToView} title="Fit to View" className="toolbar-btn">
            🔍
          </button>
          <button onClick={showAll} title="Show All" className="toolbar-btn">
            👁️
          </button>
          <button onClick={isolateSelection} title="Isolate Selection" className="toolbar-btn">
            🎯
          </button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={explodeModel} title="Explode/Unexplode" className="toolbar-btn">
            💥
          </button>
          <button onClick={toggleWireframe} title="Toggle Wireframe" className="toolbar-btn">
            🔲
          </button>
        </div>

        <div className="toolbar-status">
          {isLoading && <span className="loading">Loading model...</span>}
          {!isLoading && <span className="ready">Model ready</span>}
        </div>
      </div>

      {/* Viewer Container */}
      <div 
        ref={viewerContainer} 
        className="forge-viewer"
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 120px)',
          position: 'relative'
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading your Revit model...</p>
        </div>
      )}
    </div>
  );
};

export default ForgeViewer;
