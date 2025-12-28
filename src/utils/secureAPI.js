// Secure API key management utilities
import React from "react";

class SecureAPIManager {
  constructor() {
    this.apiKeys = new Map();
    this.keyRotationInterval = 3600000; // 1 hour
  }

  // Store API keys with expiration
  setAPIKey(service, key, expiresIn = this.keyRotationInterval) {
    const expiresAt = Date.now() + expiresIn;
    this.apiKeys.set(service, { key, expiresAt });
  }

  // Get API key with automatic cleanup
  getAPIKey(service) {
    const keyData = this.apiKeys.get(service);
    if (!keyData) return null;

    if (Date.now() > keyData.expiresAt) {
      this.apiKeys.delete(service);
      return null;
    }

    return keyData.key;
  }

  // Fetch API key from secure server endpoint
  async fetchAPIKey(service) {
    try {
      const response = await fetch("/api/secure/get-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch API key");
      }

      const { key, expiresIn } = await response.json();
      this.setAPIKey(service, key, expiresIn);
      return key;
    } catch (error) {
      console.error(`Error fetching API key for ${service}:`, error);
      return null;
    }
  }

  // Get or fetch API key
  async getOrFetchAPIKey(service) {
    let key = this.getAPIKey(service);
    if (!key) {
      key = await this.fetchAPIKey(service);
    }
    return key;
  }
}

export const secureAPIManager = new SecureAPIManager();

// Hook for secure API key access
export const useSecureAPIKey = (service) => {
  const [apiKey, setApiKey] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadKey = async () => {
      try {
        setLoading(true);
        const key = await secureAPIManager.getOrFetchAPIKey(service);
        setApiKey(key);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadKey();
  }, [service]);

  return { apiKey, loading, error };
};
