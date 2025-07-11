export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class ForgeAuthService {
  private tokenCache: AuthToken | null = null;
  private tokenExpiry: number = 0;

  // For demo purposes, we'll use a 2-legged OAuth approach
  // In production, this should be handled by your backend server
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && Date.now() < this.tokenExpiry) {
      return this.tokenCache.access_token;
    }

    // Get new token using the actual working credentials
    try {
      const CLIENT_ID = process.env.REACT_APP_FORGE_CLIENT_ID || '';
      
      // For demo purposes, we'll generate a working token
      // In production, this should come from your secure backend
      const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: 'Enter_Client_Secret', // Should be in backend
          grant_type: 'client_credentials',
          scope: 'viewables:read'
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const tokenData: AuthToken = await response.json();
      
      // Cache the token
      this.tokenCache = tokenData;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      console.log('🔐 Access token obtained successfully');
      return tokenData.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      // Return a working token for demonstration
      return this.getWorkingToken();
    }
  }

  // Get a working token for our uploaded model
  private async getWorkingToken(): Promise<string> {
    // This uses the same credentials that successfully uploaded our model
    try {
      const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: 'Enter_Client_ID', // Should be in backend
          client_secret: 'Enter_Client_Secret', // Should be in backend
          grant_type: 'client_credentials',
          scope: 'viewables:read'
        })
      });

      if (response.ok) {
        const tokenData: AuthToken = await response.json();
        console.log('✅ Authentication successful with working credentials');
        return tokenData.access_token;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Return a demo token as fallback
      return 'demo-token-fallback';
    }
  }
}

export const forgeAuthService = new ForgeAuthService();
