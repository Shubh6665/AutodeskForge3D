import React, { useState, useEffect } from 'react';
import ForgeViewer from './ForgeViewer';
import { forgeAuthService } from './services/ForgeAuthService';
import './App.css';

function App() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const forgeUrn = process.env.REACT_APP_FORGE_URN || '';
  const clientId = process.env.REACT_APP_FORGE_CLIENT_ID || '';

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Initializing Autodesk Forge authentication...');
        
        // Get a real access token using our working credentials
        const token = await forgeAuthService.getAccessToken();
        setAccessToken(token);
        
        console.log('✅ Authentication successful');
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize authentication:', err);
        setError('Failed to authenticate with Autodesk Forge. Please check your credentials.');
        setIsLoading(false);
      }
    };

    if (forgeUrn && clientId) {
      initializeAuth();
    } else {
      setError('Missing configuration. Please check your environment variables.');
      setIsLoading(false);
    }
  }, [forgeUrn, clientId]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <h2>Initializing Autodesk Forge Viewer...</h2>
        <p>Setting up authentication and viewer components</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Application Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!forgeUrn) {
    return (
      <div className="app-error">
        <h2>⚙️ Configuration Required</h2>
        <p>Your Forge URN is not configured. Let's set it up!</p>
        <div className="config-help">
          <h3>Add to your .env file:</h3>
          <code>REACT_APP_FORGE_URN=ENTER_YOUR_FORGE_URN</code><br/>
          <code>REACT_APP_FORGE_CLIENT_ID=ENTER_YOUR_FORGE_CLIENT_ID</code>
          <p style={{ marginTop: '15px', color: '#7f8c8d' }}>
            ✅ Your Revit file is ready to view! Just add these environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🏗️ Autodesk Forge Viewer</h1>
          <div className="header-info">
            <span className="status-indicator">●</span>
            <span>Connected to Forge Platform</span>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <ForgeViewer 
          accessToken={accessToken}
          urn={forgeUrn}
        />
      </main>
    </div>
  );
}

export default App;
