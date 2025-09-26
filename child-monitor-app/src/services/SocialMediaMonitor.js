/**
 * SocialMediaMonitor - Advanced social media monitoring
 * Monitors Instagram, Threads, TikTok, Telegram, WhatsApp, and other messaging apps
 */

import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

class SocialMediaMonitor {
  constructor() {
    this.isMonitoring = false;
    this.accessibilityService = null;
    this.notificationListener = null;
    this.intervalId = null;
    
    // Social media apps to monitor
    this.targetApps = {
      instagram: {
        packageName: 'com.instagram.android',
        displayName: 'Instagram',
        type: 'social_media'
      },
      threads: {
        packageName: 'com.instagram.threads',
        displayName: 'Threads',
        type: 'social_media'
      },
      tiktok: {
        packageName: 'com.zhiliaoapp.musically',
        displayName: 'TikTok',
        type: 'social_media'
      },
      telegram: {
        packageName: 'org.telegram.messenger',
        displayName: 'Telegram',
        type: 'messaging'
      },
      whatsapp: {
        packageName: 'com.whatsapp',
        displayName: 'WhatsApp',
        type: 'messaging'
      },
      whatsapp_business: {
        packageName: 'com.whatsapp.w4b',
        displayName: 'WhatsApp Business',
        type: 'messaging'
      },
      snapchat: {
        packageName: 'com.snapchat.android',
        displayName: 'Snapchat',
        type: 'social_media'
      },
      twitter: {
        packageName: 'com.twitter.android',
        displayName: 'Twitter',
        type: 'social_media'
      },
      facebook: {
        packageName: 'com.facebook.katana',
        displayName: 'Facebook',
        type: 'social_media'
      },
      messenger: {
        packageName: 'com.facebook.orca',
        displayName: 'Messenger',
        type: 'messaging'
      },
      discord: {
        packageName: 'com.discord',
        displayName: 'Discord',
        type: 'messaging'
      },
      signal: {
        packageName: 'org.thoughtcrime.securesms',
        displayName: 'Signal',
        type: 'messaging'
      }
    };
  }

  async startMonitoring() {
    console.log('Starting social media monitoring...');
    
    try {
      if (Platform.OS !== 'android') {
        console.log('Social media monitoring is only available on Android');
        return false;
      }

      this.isMonitoring = true;
      
      // Start accessibility service monitoring
      await this.startAccessibilityMonitoring();
      
      // Start notification monitoring
      await this.startNotificationMonitoring();
      
      // Start app usage tracking for social media
      await this.startSocialMediaUsageTracking();
      
      // Start periodic screenshot monitoring (optional)
      await this.startPeriodicScreenshots();
      
      console.log('Social media monitoring started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start social media monitoring:', error);
      return false;
    }
  }

  async stopMonitoring() {
    console.log('Stopping social media monitoring...');
    
    this.isMonitoring = false;
    
    // Clear monitoring intervals
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Stop accessibility service
    if (this.accessibilityService) {
      // This would require native implementation
      console.log('Stopping accessibility service');
    }
    
    // Stop notification listener
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    
    console.log('Social media monitoring stopped');
  }

  async startAccessibilityMonitoring() {
    try {
      console.log('Starting accessibility service monitoring...');
      
      // This would require a native Android accessibility service
      // For demonstration, we'll simulate the monitoring
      
      // Listen for accessibility events (requires native implementation)
      this.accessibilityService = DeviceEventEmitter.addListener(
        'AccessibilityEvent',
        this.handleAccessibilityEvent.bind(this)
      );
      
      // Start periodic app content monitoring
      this.intervalId = setInterval(() => {
        this.monitorActiveApps();
      }, 5000); // Check every 5 seconds
      
      console.log('Accessibility monitoring enabled');
      return true;
    } catch (error) {
      console.error('Accessibility monitoring setup error:', error);
      return false;
    }
  }

  async startNotificationMonitoring() {
    try {
      console.log('Starting notification monitoring...');
      
      // Listen for notification events (requires native implementation)
      this.notificationListener = DeviceEventEmitter.addListener(
        'NotificationReceived',
        this.handleNotification.bind(this)
      );
      
      // Monitor for social media notifications
      DeviceEventEmitter.addListener('SocialMediaNotification', (notification) => {
        this.processSocialMediaNotification(notification);
      });
      
      console.log('Notification monitoring enabled');
      return true;
    } catch (error) {
      console.error('Notification monitoring setup error:', error);
      return false;
    }
  }

  async handleAccessibilityEvent(event) {
    try {
      if (!this.isMonitoring) return;
      
      console.log('Accessibility event received:', event.type);
      
      // Check if it's from a monitored social media app
      const app = this.getAppByPackageName(event.packageName);
      if (!app) return;
      
      // Process different types of events
      switch (event.type) {
        case 'TYPE_VIEW_TEXT_CHANGED':
          await this.handleTextInput(app, event);
          break;
          
        case 'TYPE_WINDOW_CONTENT_CHANGED':
          await this.handleScreenChange(app, event);
          break;
          
        case 'TYPE_NOTIFICATION_STATE_CHANGED':
          await this.handleNotificationChange(app, event);
          break;
          
        default:
          console.log('Unhandled accessibility event type:', event.type);
      }
    } catch (error) {
      console.error('Accessibility event handling error:', error);
    }
  }

  async handleTextInput(app, event) {
    try {
      // Monitor text input in social media apps
      if (event.text && event.text.length > 0) {
        const textData = {
          app: app.displayName,
          packageName: app.packageName,
          text: event.text,
          timestamp: new Date().toISOString(),
          eventType: 'text_input',
          className: event.className || 'unknown'
        };
        
        console.log(`Text input in ${app.displayName}:`, event.text.substring(0, 50));
        
        // Store and sync text input data
        await this.storeSocialMediaActivity('text_input', textData);
      }
    } catch (error) {
      console.error('Text input handling error:', error);
    }
  }

  async handleScreenChange(app, event) {
    try {
      // Monitor screen changes to detect conversations, posts, etc.
      const screenData = {
        app: app.displayName,
        packageName: app.packageName,
        timestamp: new Date().toISOString(),
        eventType: 'screen_change',
        activityType: this.detectActivityType(event)
      };
      
      console.log(`Screen change in ${app.displayName}`);
      
      // Capture screen content if possible
      if (event.contentDescription || event.text) {
        screenData.content = {
          description: event.contentDescription,
          text: event.text,
          bounds: event.bounds
        };
      }
      
      await this.storeSocialMediaActivity('screen_change', screenData);
    } catch (error) {
      console.error('Screen change handling error:', error);
    }
  }

  async handleNotification(notification) {
    try {
      if (!this.isMonitoring) return;
      
      // Check if notification is from a monitored app
      const app = this.getAppByPackageName(notification.packageName);
      if (!app) return;
      
      const notificationData = {
        app: app.displayName,
        packageName: app.packageName,
        title: notification.title,
        text: notification.text,
        timestamp: new Date().toISOString(),
        eventType: 'notification',
        largeIcon: notification.largeIcon,
        subText: notification.subText,
        ticker: notification.ticker
      };
      
      console.log(`Notification from ${app.displayName}:`, notification.title);
      
      await this.storeSocialMediaActivity('notification', notificationData);
    } catch (error) {
      console.error('Notification handling error:', error);
    }
  }

  async processSocialMediaNotification(notification) {
    try {
      // Extract message content from social media notifications
      const messageData = this.extractMessageFromNotification(notification);
      
      if (messageData) {
        await this.storeSocialMediaActivity('message_received', messageData);
        
        // Check for inappropriate content
        await this.analyzeContent(messageData);
      }
    } catch (error) {
      console.error('Social media notification processing error:', error);
    }
  }

  extractMessageFromNotification(notification) {
    try {
      const app = this.getAppByPackageName(notification.packageName);
      if (!app) return null;
      
      let messageData = {
        app: app.displayName,
        packageName: app.packageName,
        timestamp: new Date().toISOString(),
        type: 'message'
      };
      
      // Extract content based on app type
      switch (app.packageName) {
        case 'com.whatsapp':
        case 'com.whatsapp.w4b':
          messageData = this.extractWhatsAppMessage(notification, messageData);
          break;
          
        case 'org.telegram.messenger':
          messageData = this.extractTelegramMessage(notification, messageData);
          break;
          
        case 'com.instagram.android':
          messageData = this.extractInstagramMessage(notification, messageData);
          break;
          
        case 'com.instagram.threads':
          messageData = this.extractThreadsMessage(notification, messageData);
          break;
          
        default:
          messageData = this.extractGenericMessage(notification, messageData);
      }
      
      return messageData;
    } catch (error) {
      console.error('Message extraction error:', error);
      return null;
    }
  }

  extractWhatsAppMessage(notification, baseData) {
    return {
      ...baseData,
      sender: notification.title || 'Unknown',
      message: notification.text || '',
      group: notification.title?.includes(':') ? notification.title.split(':')[0] : null,
      isGroup: notification.title?.includes(':') || false
    };
  }

  extractTelegramMessage(notification, baseData) {
    return {
      ...baseData,
      sender: notification.title || 'Unknown',
      message: notification.text || '',
      channel: notification.subText || null
    };
  }

  extractInstagramMessage(notification, baseData) {
    return {
      ...baseData,
      sender: notification.title || 'Unknown',
      message: notification.text || '',
      type: notification.text?.includes('photo') ? 'photo' : 
            notification.text?.includes('video') ? 'video' : 'text'
    };
  }

  extractThreadsMessage(notification, baseData) {
    return {
      ...baseData,
      sender: notification.title || 'Unknown',
      message: notification.text || '',
      isThread: true
    };
  }

  extractGenericMessage(notification, baseData) {
    return {
      ...baseData,
      title: notification.title || '',
      message: notification.text || '',
      subText: notification.subText || ''
    };
  }

  async startSocialMediaUsageTracking() {
    try {
      console.log('Starting social media usage tracking...');
      
      // Track time spent in each social media app
      setInterval(async () => {
        if (!this.isMonitoring) return;
        
        await this.trackSocialMediaUsage();
      }, 30 * 1000); // Every 30 seconds
      
      return true;
    } catch (error) {
      console.error('Usage tracking setup error:', error);
      return false;
    }
  }

  async trackSocialMediaUsage() {
    try {
      // This would require native implementation to get currently active app
      // For now, we'll simulate usage tracking
      
      const currentTime = Date.now();
      const usageData = [];
      
      // Check usage for each monitored app
      for (const [key, app] of Object.entries(this.targetApps)) {
        const lastUsage = await AsyncStorage.getItem(`${app.packageName}_last_usage`);
        const sessionStart = await AsyncStorage.getItem(`${app.packageName}_session_start`);
        
        // Calculate session time if app is currently active
        if (sessionStart) {
          const sessionDuration = currentTime - parseInt(sessionStart);
          
          if (sessionDuration > 0) {
            usageData.push({
              app: app.displayName,
              packageName: app.packageName,
              sessionDuration: sessionDuration,
              timestamp: new Date().toISOString(),
              type: app.type
            });
          }
        }
      }
      
      if (usageData.length > 0) {
        await this.storeSocialMediaActivity('usage_tracking', { apps: usageData });
      }
      
    } catch (error) {
      console.error('Usage tracking error:', error);
    }
  }

  async startPeriodicScreenshots() {
    try {
      console.log('Starting periodic screenshot monitoring...');
      
      // Take screenshots when social media apps are active
      setInterval(async () => {
        if (!this.isMonitoring) return;
        
        // Check if a monitored app is currently active
        const activeApp = await this.getCurrentActiveApp();
        if (activeApp && this.getAppByPackageName(activeApp)) {
          await this.takeScreenshot(activeApp);
        }
      }, 2 * 60 * 1000); // Every 2 minutes
      
      return true;
    } catch (error) {
      console.error('Screenshot monitoring setup error:', error);
      return false;
    }
  }

  async takeScreenshot(packageName) {
    try {
      // This would require native implementation for screen capture
      console.log(`Taking screenshot for ${packageName}`);
      
      const screenshotData = {
        packageName: packageName,
        timestamp: new Date().toISOString(),
        type: 'screenshot',
        // screenshot: base64EncodedImage // Would be provided by native implementation
      };
      
      await this.storeSocialMediaActivity('screenshot', screenshotData);
    } catch (error) {
      console.error('Screenshot capture error:', error);
    }
  }

  async getCurrentActiveApp() {
    try {
      // This would require native implementation to get current foreground app
      // For now, return null as it requires system-level access
      return null;
    } catch (error) {
      console.error('Get active app error:', error);
      return null;
    }
  }

  detectActivityType(event) {
    try {
      const className = event.className?.toLowerCase() || '';
      const text = event.text?.toLowerCase() || '';
      
      if (className.includes('chat') || className.includes('conversation')) {
        return 'messaging';
      } else if (className.includes('feed') || className.includes('timeline')) {
        return 'browsing_feed';
      } else if (className.includes('camera') || className.includes('capture')) {
        return 'taking_photo_video';
      } else if (className.includes('story') || text.includes('story')) {
        return 'viewing_story';
      } else if (className.includes('call') || text.includes('call')) {
        return 'voice_video_call';
      } else {
        return 'general_usage';
      }
    } catch (error) {
      console.error('Activity type detection error:', error);
      return 'unknown';
    }
  }

  async analyzeContent(messageData) {
    try {
      // Basic content analysis for inappropriate content
      const message = messageData.message?.toLowerCase() || '';
      const inappropriateKeywords = [
        'drugs', 'alcohol', 'bullying', 'suicide', 'self-harm',
        'violence', 'explicit', 'adult', 'meeting', 'secret',
        'don\'t tell', 'private', 'nudes'
      ];
      
      const flaggedWords = inappropriateKeywords.filter(keyword => 
        message.includes(keyword)
      );
      
      if (flaggedWords.length > 0) {
        console.log('Inappropriate content detected:', flaggedWords);
        
        // Send alert to parents
        await ApiService.sendAlert('inappropriate_content', {
          app: messageData.app,
          sender: messageData.sender,
          flaggedWords: flaggedWords,
          message: messageData.message?.substring(0, 100), // First 100 chars
          timestamp: messageData.timestamp,
          severity: flaggedWords.some(word => 
            ['suicide', 'self-harm', 'meeting', 'nudes'].includes(word)
          ) ? 'high' : 'medium'
        });
      }
      
      // Check for cyberbullying patterns
      await this.detectCyberbullying(messageData);
      
    } catch (error) {
      console.error('Content analysis error:', error);
    }
  }

  async detectCyberbullying(messageData) {
    try {
      const message = messageData.message?.toLowerCase() || '';
      const bullyingPatterns = [
        'you\'re stupid', 'kill yourself', 'nobody likes you',
        'loser', 'worthless', 'ugly', 'hate you', 'die'
      ];
      
      const detected = bullyingPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      if (detected) {
        await ApiService.sendAlert('cyberbullying_detected', {
          app: messageData.app,
          sender: messageData.sender,
          message: messageData.message?.substring(0, 100),
          timestamp: messageData.timestamp,
          severity: 'high'
        });
      }
    } catch (error) {
      console.error('Cyberbullying detection error:', error);
    }
  }

  async storeSocialMediaActivity(type, data) {
    try {
      const key = `social_media_${type}_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      // Try to sync immediately if connected
      const connected = await ApiService.checkConnection();
      if (connected) {
        await this.syncSocialMediaData();
      }
      
    } catch (error) {
      console.error('Store social media activity error:', error);
    }
  }

  async syncSocialMediaData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const socialMediaKeys = keys.filter(key => key.startsWith('social_media_'));
      
      if (socialMediaKeys.length === 0) return;
      
      console.log(`Syncing ${socialMediaKeys.length} social media activities`);
      
      const activities = [];
      for (const key of socialMediaKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            activities.push(JSON.parse(data));
          }
        } catch (parseError) {
          console.error(`Error parsing ${key}:`, parseError);
        }
      }
      
      if (activities.length > 0) {
        const childId = await AsyncStorage.getItem('child_id');
        if (childId) {
          // Send to backend
          await ApiService.makeRequest('POST', `/monitoring/${childId}/social-media/batch`, {
            activities: activities,
            sync_timestamp: new Date().toISOString()
          });
          
          // Remove synced data
          for (const key of socialMediaKeys) {
            await AsyncStorage.removeItem(key);
          }
          
          console.log('Social media data synced successfully');
        }
      }
    } catch (error) {
      console.error('Social media data sync error:', error);
    }
  }

  getAppByPackageName(packageName) {
    return Object.values(this.targetApps).find(app => 
      app.packageName === packageName
    );
  }

  async monitorActiveApps() {
    try {
      // This would monitor currently active social media apps
      // and trigger appropriate monitoring actions
      
      for (const app of Object.values(this.targetApps)) {
        const isActive = await this.isAppActive(app.packageName);
        
        if (isActive) {
          // App is currently active, enhance monitoring
          await this.enhanceMonitoringForApp(app);
        }
      }
    } catch (error) {
      console.error('Active app monitoring error:', error);
    }
  }

  async isAppActive(packageName) {
    try {
      // This would require native implementation to check if specific app is in foreground
      return false; // Placeholder
    } catch (error) {
      console.error('Check app active error:', error);
      return false;
    }
  }

  async enhanceMonitoringForApp(app) {
    try {
      console.log(`Enhancing monitoring for active app: ${app.displayName}`);
      
      // Store app session start time
      const sessionStart = await AsyncStorage.getItem(`${app.packageName}_session_start`);
      if (!sessionStart) {
        await AsyncStorage.setItem(`${app.packageName}_session_start`, Date.now().toString());
      }
      
      // Increase monitoring frequency for active app
      // This could include more frequent screenshots, text monitoring, etc.
      
    } catch (error) {
      console.error('Enhanced monitoring error:', error);
    }
  }

  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      targetApps: Object.keys(this.targetApps).length,
      hasAccessibilityService: this.accessibilityService !== null,
      hasNotificationListener: this.notificationListener !== null
    };
  }

  getMonitoredApps() {
    return this.targetApps;
  }
}

export { SocialMediaMonitor };
export default new SocialMediaMonitor();