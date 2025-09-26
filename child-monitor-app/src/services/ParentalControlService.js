/**
 * ParentalControlService - App blocking and time restrictions
 * Handles remote parental controls from the parent dashboard
 */

import { Platform, Alert, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

class ParentalControlService {
  constructor() {
    this.isActive = false;
    this.checkInterval = null;
    this.blockedApps = new Set();
    this.timeRestrictions = {};
    this.appTimeLimits = {};
    this.usageTimer = {};
    
    // App state listener
    this.appStateListener = null;
  }

  async start() {
    console.log('Starting parental control service...');
    
    try {
      this.isActive = true;
      
      // Load current restrictions from storage
      await this.loadRestrictions();
      
      // Start monitoring app launches
      await this.startAppMonitoring();
      
      // Start time restriction monitoring
      this.startTimeMonitoring();
      
      // Listen for app state changes
      this.setupAppStateListener();
      
      // Periodic sync with backend for new restrictions
      this.startPeriodicSync();
      
      console.log('Parental control service started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start parental control service:', error);
      return false;
    }
  }

  async stop() {
    console.log('Stopping parental control service...');
    
    this.isActive = false;
    
    // Clear monitoring intervals
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Remove app state listener
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    console.log('Parental control service stopped');
  }

  async loadRestrictions() {
    try {
      // Load blocked apps
      const blockedAppsData = await AsyncStorage.getItem('blocked_apps');
      if (blockedAppsData) {
        const blocked = JSON.parse(blockedAppsData);
        this.blockedApps = new Set(blocked);
        console.log(`Loaded ${this.blockedApps.size} blocked apps`);
      }
      
      // Load time restrictions (bedtime, etc.)
      const timeRestrictionsData = await AsyncStorage.getItem('time_restrictions');
      if (timeRestrictionsData) {
        this.timeRestrictions = JSON.parse(timeRestrictionsData);
        console.log('Loaded time restrictions:', this.timeRestrictions);
      }
      
      // Load app time limits
      const appTimeLimitsData = await AsyncStorage.getItem('app_time_limits');
      if (appTimeLimitsData) {
        this.appTimeLimits = JSON.parse(appTimeLimitsData);
        console.log('Loaded app time limits:', this.appTimeLimits);
      }
      
      // Load current usage timers
      const usageData = await AsyncStorage.getItem('daily_usage_timers');
      if (usageData) {
        const stored = JSON.parse(usageData);
        const today = new Date().toDateString();
        
        // Only load if it's from today
        if (stored.date === today) {
          this.usageTimer = stored.timers || {};
        } else {
          // Reset for new day
          this.usageTimer = {};
          await this.saveDailyUsage();
        }
      }
      
    } catch (error) {
      console.error('Load restrictions error:', error);
    }
  }

  async startAppMonitoring() {
    try {
      console.log('Starting app launch monitoring...');
      
      if (Platform.OS !== 'android') {
        console.log('App blocking only available on Android');
        return false;
      }
      
      // This would require a native Android service to monitor app launches
      // For demonstration, we'll simulate the monitoring
      
      this.checkInterval = setInterval(() => {
        this.checkCurrentApp();
      }, 2000); // Check every 2 seconds
      
      return true;
    } catch (error) {
      console.error('App monitoring setup error:', error);
      return false;
    }
  }

  async checkCurrentApp() {
    try {
      if (!this.isActive) return;
      
      // This would require native implementation to get current foreground app
      // For now, we'll simulate by checking if we should block certain times
      
      const currentTime = new Date();
      const currentPackage = await this.getCurrentForegroundApp();
      
      if (currentPackage) {
        // Check if app is blocked
        if (this.blockedApps.has(currentPackage)) {
          await this.blockApp(currentPackage, 'App is blocked by parental controls');
          return;
        }
        
        // Check time restrictions
        if (this.isTimeRestricted(currentTime)) {
          await this.blockApp(currentPackage, 'Device usage is restricted at this time');
          return;
        }
        
        // Check app time limits
        if (await this.isAppTimeLimitExceeded(currentPackage)) {
          await this.blockApp(currentPackage, 'Daily time limit exceeded for this app');
          return;
        }
        
        // Update usage timer
        await this.updateUsageTimer(currentPackage);
      }
      
    } catch (error) {
      console.error('Current app check error:', error);
    }
  }

  async getCurrentForegroundApp() {
    try {
      // This would require native Android implementation
      // to get the currently running foreground application
      return null; // Placeholder
    } catch (error) {
      console.error('Get foreground app error:', error);
      return null;
    }
  }

  async blockApp(packageName, reason) {
    try {
      console.log(`Blocking app ${packageName}: ${reason}`);
      
      // Show blocking overlay/alert
      Alert.alert(
        'App Blocked',
        reason,
        [
          {
            text: 'OK',
            onPress: () => {
              // Close the blocked app (requires native implementation)
              this.forceCloseApp(packageName);
            }
          }
        ],
        { cancelable: false }
      );
      
      // Send alert to parents
      await ApiService.sendAlert('app_blocked', {
        packageName: packageName,
        reason: reason,
        timestamp: new Date().toISOString(),
        deviceInfo: await this.getDeviceContext()
      });
      
      // Log the blocking event
      await this.logBlockingEvent(packageName, reason);
      
    } catch (error) {
      console.error('Block app error:', error);
    }
  }

  async forceCloseApp(packageName) {
    try {
      // This would require native Android implementation
      // to force close an application
      console.log(`Force closing app: ${packageName}`);
      
      // Alternative: Navigate to home screen
      // Linking.openURL('android-app://com.android.launcher');
      
    } catch (error) {
      console.error('Force close app error:', error);
    }
  }

  isTimeRestricted(currentTime) {
    try {
      const hour = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const dayOfWeek = currentTime.getDay(); // 0 = Sunday
      const currentMinutes = hour * 60 + minutes;
      
      // Check bedtime restrictions
      if (this.timeRestrictions.bedtime) {
        const { start, end, days } = this.timeRestrictions.bedtime;
        
        if (!days || days.includes(dayOfWeek)) {
          const startMinutes = this.timeToMinutes(start);
          const endMinutes = this.timeToMinutes(end);
          
          // Handle overnight restrictions (e.g., 22:00 to 06:00)
          if (startMinutes > endMinutes) {
            if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
              return true;
            }
          } else {
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
              return true;
            }
          }
        }
      }
      
      // Check school hours restrictions
      if (this.timeRestrictions.schoolHours) {
        const { start, end, days } = this.timeRestrictions.schoolHours;
        
        if (days && days.includes(dayOfWeek)) {
          const startMinutes = this.timeToMinutes(start);
          const endMinutes = this.timeToMinutes(end);
          
          if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Time restriction check error:', error);
      return false;
    }
  }

  timeToMinutes(timeString) {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    } catch (error) {
      console.error('Time conversion error:', error);
      return 0;
    }
  }

  async isAppTimeLimitExceeded(packageName) {
    try {
      const limit = this.appTimeLimits[packageName];
      if (!limit) return false;
      
      const usage = this.usageTimer[packageName] || 0;
      const limitMinutes = limit * 60 * 1000; // Convert minutes to milliseconds
      
      return usage >= limitMinutes;
    } catch (error) {
      console.error('Time limit check error:', error);
      return false;
    }
  }

  async updateUsageTimer(packageName) {
    try {
      const now = Date.now();
      const lastUpdate = await AsyncStorage.getItem(`${packageName}_last_update`);
      
      if (lastUpdate) {
        const timeDiff = now - parseInt(lastUpdate);
        
        // Only count if less than 10 seconds (to avoid counting long pauses)
        if (timeDiff < 10000) {
          this.usageTimer[packageName] = (this.usageTimer[packageName] || 0) + timeDiff;
        }
      }
      
      await AsyncStorage.setItem(`${packageName}_last_update`, now.toString());
      
      // Save usage data periodically
      if (now % 30000 < 2000) { // Every 30 seconds approximately
        await this.saveDailyUsage();
      }
      
    } catch (error) {
      console.error('Usage timer update error:', error);
    }
  }

  async saveDailyUsage() {
    try {
      const usageData = {
        date: new Date().toDateString(),
        timers: this.usageTimer,
        lastSaved: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('daily_usage_timers', JSON.stringify(usageData));
    } catch (error) {
      console.error('Save daily usage error:', error);
    }
  }

  startTimeMonitoring() {
    // Check time restrictions every minute
    setInterval(() => {
      if (!this.isActive) return;
      
      const now = new Date();
      if (this.isTimeRestricted(now)) {
        this.handleTimeRestriction();
      }
    }, 60 * 1000); // Every minute
  }

  async handleTimeRestriction() {
    try {
      console.log('Time restriction active');
      
      // Show time restriction alert
      Alert.alert(
        'Device Restricted',
        'This device is currently restricted due to bedtime or study time.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Could minimize apps or show a blocking screen
              this.showTimeRestrictionScreen();
            }
          }
        ],
        { cancelable: false }
      );
      
      // Send alert to parents
      await ApiService.sendAlert('time_restriction_active', {
        timestamp: new Date().toISOString(),
        restriction: this.getCurrentRestriction()
      });
      
    } catch (error) {
      console.error('Handle time restriction error:', error);
    }
  }

  async showTimeRestrictionScreen() {
    try {
      // This would show a full-screen overlay preventing app usage
      // Requires native implementation for proper blocking
      console.log('Showing time restriction screen');
    } catch (error) {
      console.error('Show restriction screen error:', error);
    }
  }

  getCurrentRestriction() {
    const now = new Date();
    
    if (this.isTimeRestricted(now)) {
      if (this.timeRestrictions.bedtime) {
        return {
          type: 'bedtime',
          details: this.timeRestrictions.bedtime
        };
      }
      
      if (this.timeRestrictions.schoolHours) {
        return {
          type: 'school_hours',
          details: this.timeRestrictions.schoolHours
        };
      }
    }
    
    return null;
  }

  setupAppStateListener() {
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App came to foreground, check current restrictions
        this.checkCurrentApp();
      }
    });
  }

  startPeriodicSync() {
    // Sync restrictions with backend every 5 minutes
    setInterval(async () => {
      if (!this.isActive) return;
      
      await this.syncRestrictions();
    }, 5 * 60 * 1000);
  }

  async syncRestrictions() {
    try {
      console.log('Syncing parental control restrictions...');
      
      // Get latest restrictions from backend
      const restrictions = await ApiService.getDeviceControls();
      
      if (restrictions) {
        // Update blocked apps
        if (restrictions.blockedApps) {
          this.blockedApps = new Set(restrictions.blockedApps);
          await AsyncStorage.setItem('blocked_apps', JSON.stringify(restrictions.blockedApps));
        }
        
        // Update time restrictions
        if (restrictions.timeRestrictions) {
          this.timeRestrictions = restrictions.timeRestrictions;
          await AsyncStorage.setItem('time_restrictions', JSON.stringify(restrictions.timeRestrictions));
        }
        
        // Update app time limits
        if (restrictions.appTimeLimits) {
          this.appTimeLimits = restrictions.appTimeLimits;
          await AsyncStorage.setItem('app_time_limits', JSON.stringify(restrictions.appTimeLimits));
        }
        
        console.log('Restrictions synced successfully');
      }
      
    } catch (error) {
      console.error('Sync restrictions error:', error);
    }
  }

  async logBlockingEvent(packageName, reason) {
    try {
      const event = {
        packageName: packageName,
        reason: reason,
        timestamp: new Date().toISOString(),
        eventType: 'app_blocked'
      };
      
      // Store locally
      const key = `blocking_event_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(event));
      
      // Try to sync immediately
      const connected = await ApiService.checkConnection();
      if (connected) {
        await this.syncBlockingEvents();
      }
      
    } catch (error) {
      console.error('Log blocking event error:', error);
    }
  }

  async syncBlockingEvents() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const eventKeys = keys.filter(key => key.startsWith('blocking_event_'));
      
      if (eventKeys.length === 0) return;
      
      const events = [];
      for (const key of eventKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          events.push(JSON.parse(data));
        }
      }
      
      if (events.length > 0) {
        const childId = await AsyncStorage.getItem('child_id');
        if (childId) {
          await ApiService.makeRequest('POST', `/monitoring/${childId}/control-events/batch`, {
            events: events,
            sync_timestamp: new Date().toISOString()
          });
          
          // Remove synced events
          for (const key of eventKeys) {
            await AsyncStorage.removeItem(key);
          }
          
          console.log(`Synced ${events.length} blocking events`);
        }
      }
      
    } catch (error) {
      console.error('Sync blocking events error:', error);
    }
  }

  async getDeviceContext() {
    try {
      return {
        timestamp: new Date().toISOString(),
        battery: await this.getBatteryLevel(),
        location: await this.getCurrentLocation()
      };
    } catch (error) {
      console.error('Get device context error:', error);
      return {};
    }
  }

  async getBatteryLevel() {
    try {
      // This would require native implementation
      return 0.5; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  async getCurrentLocation() {
    try {
      // This would get current location if needed for context
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }

  // Public methods for controlling restrictions
  async addBlockedApp(packageName, appName) {
    try {
      this.blockedApps.add(packageName);
      await AsyncStorage.setItem('blocked_apps', JSON.stringify([...this.blockedApps]));
      
      console.log(`Added blocked app: ${appName} (${packageName})`);
      return true;
    } catch (error) {
      console.error('Add blocked app error:', error);
      return false;
    }
  }

  async removeBlockedApp(packageName) {
    try {
      this.blockedApps.delete(packageName);
      await AsyncStorage.setItem('blocked_apps', JSON.stringify([...this.blockedApps]));
      
      console.log(`Removed blocked app: ${packageName}`);
      return true;
    } catch (error) {
      console.error('Remove blocked app error:', error);
      return false;
    }
  }

  async setTimeRestriction(type, startTime, endTime, days = null) {
    try {
      this.timeRestrictions[type] = {
        start: startTime,
        end: endTime,
        days: days,
        enabled: true
      };
      
      await AsyncStorage.setItem('time_restrictions', JSON.stringify(this.timeRestrictions));
      
      console.log(`Set time restriction: ${type} from ${startTime} to ${endTime}`);
      return true;
    } catch (error) {
      console.error('Set time restriction error:', error);
      return false;
    }
  }

  async setAppTimeLimit(packageName, limitMinutes) {
    try {
      this.appTimeLimits[packageName] = limitMinutes;
      await AsyncStorage.setItem('app_time_limits', JSON.stringify(this.appTimeLimits));
      
      console.log(`Set time limit for ${packageName}: ${limitMinutes} minutes`);
      return true;
    } catch (error) {
      console.error('Set app time limit error:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      blockedAppsCount: this.blockedApps.size,
      timeRestrictionsCount: Object.keys(this.timeRestrictions).length,
      appLimitsCount: Object.keys(this.appTimeLimits).length,
      hasAppMonitoring: this.checkInterval !== null
    };
  }

  getBlockedApps() {
    return [...this.blockedApps];
  }

  getTimeRestrictions() {
    return this.timeRestrictions;
  }

  getAppTimeLimits() {
    return this.appTimeLimits;
  }

  getDailyUsage() {
    return this.usageTimer;
  }
}

export { ParentalControlService };
export default new ParentalControlService();