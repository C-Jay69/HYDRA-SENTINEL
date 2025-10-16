/**
 * SocialMediaMonitor.js: Advanced social media and messaging app monitoring.
 * 
 * This service is designed to work with a native Android Accessibility Service and
 * Notification Listener. The native components are responsible for capturing events
 * and sending them to this JavaScript layer via DeviceEventEmitter.
 * 
 * This script then processes, analyzes, stores, and syncs the captured data.
 */

import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

class SocialMediaMonitor {
  constructor() {
    this.isMonitoring = false;
    this.listeners = [];
    this.syncInterval = null;

    // List of target applications for monitoring. 
    // The keywords will help identify context from accessibility events.
    this.targetApps = {
      // Social Media
      instagram: { packageName: 'com.instagram.android', name: 'Instagram', type: 'social' },
      tiktok: { packageName: 'com.zhiliaoapp.musically', name: 'TikTok', type: 'social' },
      snapchat: { packageName: 'com.snapchat.android', name: 'Snapchat', type: 'social' },
      threads: { packageName: 'com.instagram.threads', name: 'Threads', type: 'social' },
      twitter: { packageName: 'com.twitter.android', name: 'Twitter / X', type: 'social' },
      facebook: { packageName: 'com.facebook.katana', name: 'Facebook', type: 'social' },
      
      // Messaging Apps
      whatsapp: { packageName: 'com.whatsapp', name: 'WhatsApp', type: 'messaging' },
      messenger: { packageName: 'com.facebook.orca', name: 'Messenger', type: 'messaging' },
      telegram: { packageName: 'org.telegram.messenger', name: 'Telegram', type: 'messaging' },
      discord: { packageName: 'com.discord', name: 'Discord', type: 'messaging' },
      signal: { packageName: 'org.thoughtcrime.securesms', name: 'Signal', type: 'messaging' },
    };

    this.inappropriateKeywords = [
      'drugs', 'alcohol', 'vape', 'suicide', 'self-harm', 'kill myself',
      'bullying', 'loser', 'ugly', 'hate you', 'nobody likes you',
      'violence', 'explicit', 'adult', 'porn', 'nudes', 'sexting',
      'meeting', 'secret', 'don\'t tell', 'my address is', 'come over'
    ];
  }

  /**
   * Starts the monitoring services. This should be called after the user grants
   * the necessary permissions (Accessibility and Notification Listener).
   */
  async start() {
    if (this.isMonitoring || Platform.OS !== 'android') {
      if(Platform.OS !== 'android') console.warn("Social media monitoring is only available on Android.");
      return;
    }

    console.log('[SocialMediaMonitor] Starting monitoring...');
    this.isMonitoring = true;

    // **NATIVE HOOK**: The app should ensure the native services are running.
    // For now, we assume they are and will emit events.

    // Register listeners for events from native modules
    this.registerListeners();

    // Start a periodic sync to upload data to the backend
    this.syncInterval = setInterval(() => this.syncActivities(), 60 * 1000); // Sync every minute

    console.log('[SocialMediaMonitor] Monitoring started.');
  }

  /**
   * Stops all monitoring activities and clears intervals.
   */
  stop() {
    if (!this.isMonitoring) return;
    console.log('[SocialMediaMonitor] Stopping monitoring...');
    this.isMonitoring = false;

    // Remove all event listeners
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];

    // Clear the sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('[SocialMediaMonitor] Monitoring stopped.');
  }

  /**
   * Registers listeners for data coming from the native side.
   */
  registerListeners() {
    // Listener for accessibility events (e.g., on-screen text changes)
    const accessibilityListener = DeviceEventEmitter.addListener(
      'onAccessibilityEvent', 
      this.handleAccessibilityEvent.bind(this)
    );
    this.listeners.push(accessibilityListener);

    // Listener for posted notifications
    const notificationListener = DeviceEventEmitter.addListener(
      'onNotificationPosted',
      this.handleNotification.bind(this)
    );
    this.listeners.push(notificationListener);
  }

  // --- Event Handlers --- //

  /**
   * Handles incoming accessibility events from the native service.
   * This is the core of the in-app content monitoring.
   * @param {object} event - The accessibility event data from the native side.
   *        Expected format: { packageName: string, eventType: string, text: string, contentDescription: string }
   */
  handleAccessibilityEvent(event) {
    if (!this.isMonitoring || !event || !event.packageName) return;

    const app = this.findAppByPackageName(event.packageName);
    if (!app) return; // Not a target app

    const capturedText = (event.text || '').trim();
    if (capturedText.length < 3) return; // Ignore very short text strings

    console.log(`[SocialMediaMonitor] Captured text from ${app.name}: "${capturedText.substring(0, 50)}..."`);

    const activity = {
      app: app.name,
      packageName: app.packageName,
      eventType: 'text_capture',
      content: { text: capturedText },
      timestamp: new Date().toISOString(),
    };

    this.storeActivity(activity);
    this.analyzeContent(activity);
  }

  /**
   * Handles incoming notifications from the native notification listener.
   * @param {object} notification - The notification data from the native side.
   *        Expected format: { packageName: string, title: string, text: string }
   */
  handleNotification(notification) {
    if (!this.isMonitoring || !notification || !notification.packageName) return;

    const app = this.findAppByPackageName(notification.packageName);
    if (!app) return; // Not from a target app

    // Ignore non-messaging notifications
    if (!notification.title || !notification.text) return;

    console.log(`[SocialMediaMonitor] Captured notification from ${app.name}: ${notification.title}`);

    const activity = {
      app: app.name,
      packageName: app.packageName,
      eventType: 'notification_received',
      content: {
        sender: notification.title,
        message: notification.text,
      },
      timestamp: new Date().toISOString(),
    };

    this.storeActivity(activity);
    this.analyzeContent(activity);
  }

  // --- Data Processing and Analysis --- //

  /**
   * Analyzes captured content for inappropriate keywords and triggers an alert if found.
   * @param {object} activity - The activity object containing the content to analyze.
   */
  async analyzeContent(activity) {
    const textToAnalyze = activity.content.text || activity.content.message || '';
    if (!textToAnalyze) return;

    const flaggedWords = this.inappropriateKeywords.filter(keyword => 
      textToAnalyze.toLowerCase().includes(keyword)
    );

    if (flaggedWords.length > 0) {
      console.warn(`[SocialMediaMonitor] Inappropriate content detected in ${activity.app}:`, flaggedWords);
      
      await ApiService.sendAlert('inappropriate_content', {
        app: activity.app,
        details: `Flagged words found: ${flaggedWords.join(', ')}`,
        originalText: textToAnalyze.substring(0, 150), // Send a snippet
        severity: 'high',
      });
    }
  }

  // --- Data Storage and Syncing --- //

  /**
   * Stores a captured activity in AsyncStorage, ready for the next sync.
   * @param {object} activity - The activity data to store.
   */
  async storeActivity(activity) {
    try {
      const key = `sm_activity_${Date.now()}_${Math.random()}`;
      await AsyncStorage.setItem(key, JSON.stringify(activity));
    } catch (error) {
      console.error('[SocialMediaMonitor] Error storing activity:', error);
    }
  }

  /**
   * Gathers all stored activities, sends them to the backend, 
   * and clears them from local storage on success.
   */
  async syncActivities() {
    const keys = await AsyncStorage.getAllKeys();
    const activityKeys = keys.filter(key => key.startsWith('sm_activity_'));

    if (activityKeys.length === 0) return;

    console.log(`[SocialMediaMonitor] Syncing ${activityKeys.length} social media activities.`);

    let activities = [];
    for (const key of activityKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) activities.push(JSON.parse(data));
      } catch (e) {
        console.error(`[SocialMediaMonitor] Error parsing activity ${key}, skipping.`, e);
      }
    }

    if (activities.length === 0) return;

    try {
      const childId = await ApiService.getChildId();
      if (!childId) {
        console.error('[SocialMediaMonitor] Cannot sync: childId not found.');
        return;
      }

      const response = await ApiService.syncSocialMedia(activities);
      if (response && response.synced > 0) {
        console.log(`[SocialMediaMonitor] Successfully synced ${response.synced} activities.`);
        // Clear the synced items from storage
        await AsyncStorage.multiRemove(activityKeys);
      }
    } catch (error) {
      console.error('[SocialMediaMonitor] Failed to sync social media activities:', error);
    }
  }

  // --- Helpers --- //

  findAppByPackageName(packageName) {
    return Object.values(this.targetApps).find(app => app.packageName === packageName);
  }
}

export default new SocialMediaMonitor();
