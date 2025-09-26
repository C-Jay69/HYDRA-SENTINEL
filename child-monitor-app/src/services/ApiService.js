/**
 * ApiService - Backend API communication
 * Handles all communication with ParentGuard backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

class ApiService {
  constructor() {
    // Backend URL - should match your backend server
    this.baseURL = 'https://your-backend-url.com/api'; // Update with your backend URL
    this.deviceId = null;
    this.authToken = null;
  }

  async initialize() {
    try {
      this.deviceId = await DeviceInfo.getUniqueId();
      this.authToken = await AsyncStorage.getItem('auth_token');
      console.log('ApiService initialized:', { deviceId: this.deviceId });
    } catch (error) {
      console.error('ApiService initialization error:', error);
    }
  }

  // Authentication & Device Registration
  async registerDevice(deviceInfo) {
    try {
      const response = await this.makeRequest('POST', '/devices/register', {
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName,
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        system_version: deviceInfo.systemVersion,
        app_version: deviceInfo.appVersion,
        registration_timestamp: new Date().toISOString()
      });

      if (response.success) {
        // Store authentication token if provided
        if (response.auth_token) {
          this.authToken = response.auth_token;
          await AsyncStorage.setItem('auth_token', response.auth_token);
        }
        
        // Store device registration info
        await AsyncStorage.setItem('device_registered', 'true');
        await AsyncStorage.setItem('child_id', response.child_id);
        
        console.log('Device registered successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Device registration error:', error);
      return false;
    }
  }

  // Check connection to backend
  async checkConnection() {
    try {
      const response = await this.makeRequest('GET', '/health');
      return response.status === 'healthy';
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  // Sync Call Logs
  async syncCallLogs(callLogs) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('POST', `/monitoring/${childId}/calls/batch`, {
        call_logs: callLogs,
        sync_timestamp: new Date().toISOString()
      });

      console.log(`Synced ${callLogs.length} call logs`);
      return response.success;
    } catch (error) {
      console.error('Call logs sync error:', error);
      return false;
    }
  }

  // Sync Location
  async syncLocation(locationData) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('POST', `/monitoring/${childId}/location`, locationData);
      
      console.log('Location synced successfully');
      return response.success;
    } catch (error) {
      console.error('Location sync error:', error);
      return false;
    }
  }

  // Sync App Usage
  async syncAppUsage(usageData) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('POST', `/monitoring/${childId}/apps/batch`, {
        app_usage: usageData,
        sync_timestamp: new Date().toISOString()
      });

      console.log(`Synced usage data for ${usageData.length} apps`);
      return response.success;
    } catch (error) {
      console.error('App usage sync error:', error);
      return false;
    }
  }

  // Sync Contacts
  async syncContacts(contacts) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('POST', `/monitoring/${childId}/contacts/batch`, {
        contacts: contacts,
        sync_timestamp: new Date().toISOString()
      });

      console.log(`Synced ${contacts.length} contacts`);
      return response.success;
    } catch (error) {
      console.error('Contacts sync error:', error);
      return false;
    }
  }

  // Get device settings/controls from backend
  async getDeviceControls() {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('GET', `/control/${childId}/settings`);
      
      if (response.success) {
        return {
          blockedApps: response.data.blocked_apps || [],
          blockedWebsites: response.data.blocked_websites || [],
          timeRestrictions: response.data.bedtime_restrictions || null,
          locationTracking: response.data.location_tracking_enabled || true,
          appTimeLimits: response.data.app_time_limits || {}
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get device controls error:', error);
      return null;
    }
  }

  // Send device status update
  async sendStatusUpdate(status) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('POST', `/monitoring/${childId}/status`, {
        status: status,
        timestamp: new Date().toISOString()
      });

      return response.success;
    } catch (error) {
      console.error('Status update error:', error);
      return false;
    }
  }

  // Send alert to parents
  async sendAlert(alertType, alertData) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (!childId) {
        throw new Error('Child ID not found');
      }

      const response = await this.makeRequest('POST', `/monitoring/${childId}/alerts`, {
        type: alertType,
        data: alertData,
        timestamp: new Date().toISOString(),
        severity: alertData.severity || 'medium'
      });

      console.log(`Alert sent: ${alertType}`);
      return response.success;
    } catch (error) {
      console.error('Send alert error:', error);
      return false;
    }
  }

  // Generic request method
  async makeRequest(method, endpoint, data = null) {
    try {
      if (!this.deviceId) {
        await this.initialize();
      }

      const url = `${this.baseURL}${endpoint}`;
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `ParentGuard-Monitor/${await DeviceInfo.getVersion()}`,
          'X-Device-ID': this.deviceId
        },
        timeout: 30000
      };

      // Add authentication if available
      if (this.authToken) {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Add body for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      console.log(`API Request: ${method} ${endpoint}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Handle successful response
      return {
        success: true,
        data: responseData,
        status: response.status
      };

    } catch (error) {
      console.error(`API Request failed: ${method} ${endpoint}`, error);
      
      // Return error response
      return {
        success: false,
        error: error.message,
        status: error.status || 0
      };
    }
  }

  // Offline data management
  async storeOfflineData(type, data) {
    try {
      const key = `offline_${type}_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Stored offline data: ${key}`);
    } catch (error) {
      console.error('Store offline data error:', error);
    }
  }

  async syncOfflineData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      
      console.log(`Found ${offlineKeys.length} offline data entries`);
      
      for (const key of offlineKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          const parsedData = JSON.parse(data);
          
          // Determine data type and sync accordingly
          if (key.includes('calls')) {
            await this.syncCallLogs(parsedData);
          } else if (key.includes('location')) {
            await this.syncLocation(parsedData);
          } else if (key.includes('apps')) {
            await this.syncAppUsage(parsedData);
          } else if (key.includes('contacts')) {
            await this.syncContacts(parsedData);
          }
          
          // Remove synced data
          await AsyncStorage.removeItem(key);
          console.log(`Synced and removed offline data: ${key}`);
          
        } catch (syncError) {
          console.error(`Failed to sync offline data ${key}:`, syncError);
        }
      }
    } catch (error) {
      console.error('Sync offline data error:', error);
    }
  }

  // Get configuration updates
  async getUpdates() {
    try {
      const lastUpdate = await AsyncStorage.getItem('last_update_check');
      const params = lastUpdate ? `?since=${lastUpdate}` : '';
      
      const response = await this.makeRequest('GET', `/devices/${this.deviceId}/updates${params}`);
      
      if (response.success && response.data.updates) {
        await AsyncStorage.setItem('last_update_check', new Date().toISOString());
        return response.data.updates;
      }
      
      return [];
    } catch (error) {
      console.error('Get updates error:', error);
      return [];
    }
  }
}

export { ApiService };
export default new ApiService();