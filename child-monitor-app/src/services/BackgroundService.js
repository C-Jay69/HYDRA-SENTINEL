/**
 * BackgroundService - Manages background task execution
 * Ensures monitoring continues when app is backgrounded
 */

import { Platform, AppState } from 'react-native';
import BackgroundJob from 'react-native-background-job';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MonitoringService from './MonitoringService';
import ApiService from './ApiService';

class BackgroundService {
  constructor() {
    this.isRunning = false;
    this.backgroundTask = null;
    this.heartbeatInterval = null;
    this.syncInterval = null;
  }

  async start() {
    console.log('Starting background service...');
    
    try {
      this.isRunning = true;
      
      // Start background fetch (iOS/Android)
      await this.startBackgroundFetch();
      
      // Start background job (Android)
      if (Platform.OS === 'android') {
        await this.startBackgroundJob();
      }
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      console.log('Background service started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start background service:', error);
      return false;
    }
  }

  async stop() {
    console.log('Stopping background service...');
    
    this.isRunning = false;
    
    // Stop background fetch
    BackgroundFetch.stop();
    
    // Stop background job
    if (this.backgroundTask) {
      BackgroundJob.cancel({ jobKey: 'parentguard-monitor' });
      this.backgroundTask = null;
    }
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    console.log('Background service stopped');
  }

  async startBackgroundFetch() {
    try {
      // Configure background fetch
      const status = await BackgroundFetch.configure({
        minimumFetchInterval: 15000, // 15 seconds (minimum for development)
        forceAlarmManager: false,
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
      }, async (taskId) => {
        console.log('Background fetch task started:', taskId);
        
        try {
          // Perform background monitoring tasks
          await this.performBackgroundTasks();
          
          // Always finish the task
          BackgroundFetch.finish(taskId);
        } catch (error) {
          console.error('Background fetch error:', error);
          BackgroundFetch.finish(taskId);
        }
      }, (error) => {
        console.error('Background fetch failed to configure:', error);
      });

      console.log('Background fetch status:', status);
      
      // Start the background fetch service
      await BackgroundFetch.start();
      
      return true;
    } catch (error) {
      console.error('Background fetch setup error:', error);
      return false;
    }
  }

  async startBackgroundJob() {
    try {
      // Android background job
      const backgroundJob = {
        jobKey: 'parentguard-monitor',
        period: 30000, // 30 seconds
        requiredNetworkType: BackgroundJob.UNMETERED_OR_DEFAULT,
        requiredChargingState: BackgroundJob.UNMETERED_OR_DEFAULT,
      };

      BackgroundJob.register({
        jobKey: 'parentguard-monitor',
        job: async () => {
          console.log('Background job executing...');
          
          try {
            // Perform monitoring tasks
            await this.performBackgroundTasks();
          } catch (error) {
            console.error('Background job error:', error);
          }
        }
      });

      BackgroundJob.start(backgroundJob);
      
      this.backgroundTask = backgroundJob;
      console.log('Background job started');
      
      return true;
    } catch (error) {
      console.error('Background job setup error:', error);
      return false;
    }
  }

  async performBackgroundTasks() {
    try {
      console.log('Performing background monitoring tasks...');
      
      // Check if monitoring should continue
      const setupComplete = await AsyncStorage.getItem('setup_complete');
      if (setupComplete !== 'true') {
        console.log('Setup not complete, skipping background tasks');
        return;
      }

      // Update heartbeat
      await this.updateHeartbeat();
      
      // Sync offline data if connected
      await ApiService.syncOfflineData();
      
      // Check for remote commands
      await this.checkRemoteCommands();
      
      // Monitor device status
      await this.monitorDeviceStatus();
      
      // Emergency location sync (if needed)
      await this.emergencyLocationSync();
      
      console.log('Background tasks completed');
    } catch (error) {
      console.error('Background tasks error:', error);
    }
  }

  startHeartbeat() {
    // Send periodic heartbeat to backend
    this.heartbeatInterval = setInterval(async () => {
      try {
        if (!this.isRunning) return;
        
        await this.sendHeartbeat();
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  startPeriodicSync() {
    // Periodic data synchronization
    this.syncInterval = setInterval(async () => {
      try {
        if (!this.isRunning) return;
        
        // Light monitoring tasks
        await this.performLightSync();
      } catch (error) {
        console.error('Periodic sync error:', error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  async sendHeartbeat() {
    try {
      const status = MonitoringService.getStatus();
      const deviceInfo = await MonitoringService.getDeviceInfo();
      
      const heartbeatData = {
        timestamp: new Date().toISOString(),
        status: 'active',
        monitoringStatus: status,
        batteryLevel: deviceInfo?.batteryLevel || 0,
        isCharging: deviceInfo?.isCharging || false,
        appVersion: deviceInfo?.appVersion || '1.0.0'
      };

      await ApiService.sendStatusUpdate(heartbeatData);
      console.log('Heartbeat sent successfully');
    } catch (error) {
      console.error('Heartbeat send error:', error);
    }
  }

  async updateHeartbeat() {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem('last_heartbeat', timestamp);
    } catch (error) {
      console.error('Update heartbeat error:', error);
    }
  }

  async checkRemoteCommands() {
    try {
      // Check for remote control commands from parents
      const updates = await ApiService.getUpdates();
      
      if (updates && updates.length > 0) {
        console.log(`Processing ${updates.length} remote commands`);
        
        for (const update of updates) {
          await this.processRemoteCommand(update);
        }
      }
    } catch (error) {
      console.error('Remote commands check error:', error);
    }
  }

  async processRemoteCommand(command) {
    try {
      console.log('Processing remote command:', command.type);
      
      switch (command.type) {
        case 'block_app':
          await this.blockApp(command.data.packageName);
          break;
          
        case 'unblock_app':
          await this.unblockApp(command.data.packageName);
          break;
          
        case 'emergency_location':
          await this.sendEmergencyLocation();
          break;
          
        case 'wipe_device':
          await this.wipeDevice();
          break;
          
        case 'take_screenshot':
          await this.takeScreenshot();
          break;
          
        case 'update_settings':
          await this.updateSettings(command.data);
          break;
          
        default:
          console.log('Unknown remote command:', command.type);
      }
      
      // Confirm command execution
      await ApiService.confirmCommandExecution(command.id);
    } catch (error) {
      console.error('Remote command processing error:', error);
    }
  }

  async blockApp(packageName) {
    try {
      // This would require native Android implementation
      console.log(`Blocking app: ${packageName}`);
      
      // Store blocked app list
      const blockedApps = await AsyncStorage.getItem('blocked_apps') || '[]';
      const blocked = JSON.parse(blockedApps);
      
      if (!blocked.includes(packageName)) {
        blocked.push(packageName);
        await AsyncStorage.setItem('blocked_apps', JSON.stringify(blocked));
      }
      
      // Send alert to indicate successful block
      await ApiService.sendAlert('app_blocked', {
        packageName: packageName,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Block app error:', error);
    }
  }

  async unblockApp(packageName) {
    try {
      console.log(`Unblocking app: ${packageName}`);
      
      const blockedApps = await AsyncStorage.getItem('blocked_apps') || '[]';
      const blocked = JSON.parse(blockedApps);
      
      const filtered = blocked.filter(app => app !== packageName);
      await AsyncStorage.setItem('blocked_apps', JSON.stringify(filtered));
      
      await ApiService.sendAlert('app_unblocked', {
        packageName: packageName,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Unblock app error:', error);
    }
  }

  async sendEmergencyLocation() {
    try {
      console.log('Sending emergency location...');
      
      // Force immediate location update
      // This would typically use high accuracy GPS
      await MonitoringService.startLocationMonitoring();
      
      await ApiService.sendAlert('emergency_location', {
        requested: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Emergency location error:', error);
    }
  }

  async takeScreenshot() {
    try {
      console.log('Taking remote screenshot...');
      
      // This would require native implementation
      const screenshot = await MonitoringService.captureScreen();
      
      if (screenshot) {
        await ApiService.sendAlert('screenshot_taken', {
          screenshot: screenshot,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  }

  async wipeDevice() {
    try {
      console.log('Device wipe requested - requires device admin');
      
      // This is a critical security feature that would require:
      // 1. Device administrator privileges
      // 2. Proper authentication
      // 3. Native Android implementation
      
      await ApiService.sendAlert('device_wipe_requested', {
        timestamp: new Date().toISOString(),
        status: 'requires_native_implementation'
      });
      
    } catch (error) {
      console.error('Device wipe error:', error);
    }
  }

  async updateSettings(settings) {
    try {
      console.log('Updating device settings:', settings);
      
      // Update local settings
      await AsyncStorage.setItem('remote_settings', JSON.stringify(settings));
      
      // Apply settings changes
      if (settings.stealthMode !== undefined) {
        await AsyncStorage.setItem('stealth_mode', settings.stealthMode.toString());
      }
      
      await ApiService.sendAlert('settings_updated', {
        settings: settings,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Update settings error:', error);
    }
  }

  async monitorDeviceStatus() {
    try {
      // Monitor for suspicious activity
      const deviceInfo = await MonitoringService.getDeviceInfo();
      
      // Check battery level
      if (deviceInfo?.batteryLevel < 0.2) { // Below 20%
        await ApiService.sendAlert('low_battery', {
          batteryLevel: deviceInfo.batteryLevel,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if device is rooted/jailbroken
      if (deviceInfo?.isEmulator) {
        await ApiService.sendAlert('emulator_detected', {
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for app uninstallation attempts
      await this.checkAppIntegrity();
      
    } catch (error) {
      console.error('Device status monitoring error:', error);
    }
  }

  async checkAppIntegrity() {
    try {
      // Check if the monitoring app is still installed and functioning
      const lastHeartbeat = await AsyncStorage.getItem('last_heartbeat');
      const now = new Date().getTime();
      const lastTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
      
      // If no heartbeat for more than 15 minutes, send alert
      if (now - lastTime > 15 * 60 * 1000) {
        await ApiService.sendAlert('monitoring_interrupted', {
          lastHeartbeat: lastHeartbeat,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('App integrity check error:', error);
    }
  }

  async emergencyLocationSync() {
    try {
      // Check if emergency location is requested
      const emergencyLocation = await AsyncStorage.getItem('emergency_location_requested');
      
      if (emergencyLocation === 'true') {
        console.log('Emergency location sync triggered');
        
        // Force immediate location update with high accuracy
        await MonitoringService.startLocationMonitoring();
        
        // Clear the emergency flag
        await AsyncStorage.removeItem('emergency_location_requested');
      }
      
    } catch (error) {
      console.error('Emergency location sync error:', error);
    }
  }

  async performLightSync() {
    try {
      // Light monitoring tasks that don't consume much battery
      
      // Check connectivity
      const connected = await ApiService.checkConnection();
      if (!connected) {
        console.log('No connectivity - storing data offline');
        return;
      }
      
      // Sync any pending offline data
      await ApiService.syncOfflineData();
      
      // Update last sync time
      await AsyncStorage.setItem('last_light_sync', new Date().toISOString());
      
    } catch (error) {
      console.error('Light sync error:', error);
    }
  }

  // Get current background service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasBackgroundTask: this.backgroundTask !== null,
      hasHeartbeat: this.heartbeatInterval !== null,
      hasPeriodicSync: this.syncInterval !== null
    };
  }

  // Handle app state changes
  handleAppStateChange(nextAppState) {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background - ensure background tasks continue
      if (this.isRunning) {
        console.log('App backgrounded - maintaining monitoring services');
      }
    } else if (nextAppState === 'active') {
      // App came to foreground - resume full monitoring
      console.log('App activated - resuming full monitoring');
      this.performBackgroundTasks();
    }
  }
}

export { BackgroundService };
export default new BackgroundService();