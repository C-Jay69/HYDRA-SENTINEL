/**
 * ApiService - Backend API communication
 * Handles all communication with ParentGuard backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

class ApiService {
  constructor() {
    // Backend URL - matches the web dashboard backend
    this.baseURL = 'https://guardianapp-9.preview.emergentagent.com/api'; // Updated to match existing backend
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

  async getChildId() {
      return await AsyncStorage.getItem('child_id');
  }

  // Authentication & Device Registration
  async registerDevice(deviceInfo) {
    try {
      const response = await this.makeRequest('POST', '/monitoring/devices/register', {
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName,
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        system_version: deviceInfo.systemVersion,
        app_version: deviceInfo.appVersion,
        registration_timestamp: new Date().toISOString()
      });

      if (response.success && response.data.child_id) {
        await AsyncStorage.setItem('device_registered', 'true');
        await AsyncStorage.setItem('child_id', response.data.child_id);
        
        console.log('Device registered successfully with child_id:', response.data.child_id);
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
      const response = await this.makeRequest('GET', '/monitoring/health');
      return response.success && response.data.status === 'healthy';
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  // Sync Call Logs
  async syncCallLogs(callLogs) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/calls/batch`, {
        call_logs: callLogs
      });

      if(response.success) console.log(`Synced ${response.data.synced} call logs`);
      return response;
    } catch (error) {
      console.error('Call logs sync error:', error);
      return { success: false };
    }
  }

  // Sync SMS
  async syncSms(smsMessages) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/sms/batch`, {
        sms_messages: smsMessages
      });

      if(response.success) console.log(`Synced ${response.data.synced} SMS messages`);
      return response;
    } catch (error) {
      console.error('SMS sync error:', error);
      return { success: false };
    }
  }

  // Sync Location
  async syncLocation(locationData) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/location`, locationData);
      
      if(response.success) console.log('Location synced successfully');
      return response;
    } catch (error) {
      console.error('Location sync error:', error);
      return { success: false };
    }
  }

  // Sync App Usage
  async syncAppUsage(usageData) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/apps/batch`, {
        app_usage: usageData
      });

      if(response.success) console.log(`Synced usage data for ${response.data.synced} apps`);
      return response;
    } catch (error) {
      console.error('App usage sync error:', error);
      return { success: false };
    }
  }

  // Sync Contacts
  async syncContacts(contacts) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/contacts/batch`, {
        contacts: contacts
      });

      if(response.success) console.log(`Synced ${response.data.synced} contacts`);
      return response;
    } catch (error) {
      console.error('Contacts sync error:', error);
      return { success: false };
    }
  }

  // Sync Social Media Activities
  async syncSocialMedia(activities) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/social-media/batch`, {
        activities: activities
      });
      
      if(response.success) console.log(`Synced ${response.data.synced} social media activities`);
      return response.data;
    } catch (error) {
      console.error('Social media sync error:', error);
      return { success: false, synced: 0 };
    }
  }

  // Send alert to parents
  async sendAlert(type, data) {
    try {
      const childId = await this.getChildId();
      if (!childId) throw new Error('Child ID not found');

      const response = await this.makeRequest('POST', `/monitoring/${childId}/alerts`, {
        type,
        ...data,
      });

      if(response.success) console.log(`Alert sent: ${type}`);
      return response;
    } catch (error) {
      console.error('Send alert error:', error);
      return { success: false };
    }
  }
  
  // Get configuration updates from the server
  async getUpdates() {
    try {
      if (!this.deviceId) await this.initialize();
      const lastUpdate = await AsyncStorage.getItem('last_update_check');
      const params = lastUpdate ? `?since=${lastUpdate}` : '';
      
      const response = await this.makeRequest('GET', `/monitoring/devices/${this.deviceId}/updates${params}`);
      
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

  // Generic request method
  async makeRequest(method, endpoint, data = null) {
    try {
      if (!this.deviceId) await this.initialize();

      const url = `${this.baseURL}${endpoint}`;
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.deviceId
        },
        timeout: 15000
      };

      if (this.authToken) {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        const errorDetail = responseData.detail || `HTTP ${response.status}`;
        throw new Error(errorDetail);
      }

      return { success: true, data: responseData, status: response.status };

    } catch (error) {
      console.error(`API Request Error: ${method} ${endpoint}`, error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();
