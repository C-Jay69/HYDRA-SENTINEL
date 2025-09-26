/**
 * PermissionManager - Handles all app permissions
 * Manages Android and iOS permissions for monitoring functionality
 */

import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

class PermissionManager {
  constructor() {
    this.requiredPermissions = this.getRequiredPermissions();
  }

  getRequiredPermissions() {
    if (Platform.OS === 'android') {
      return {
        // Core monitoring permissions
        location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        coarseLocation: PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        backgroundLocation: PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        
        // Communication monitoring
        readCallLog: PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        readSms: PermissionsAndroid.PERMISSIONS.READ_SMS,
        receiveSms: PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        readContacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        
        // Device information
        readPhoneState: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        
        // Storage for app data
        writeExternalStorage: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        readExternalStorage: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        
        // Camera and microphone (for advanced monitoring)
        camera: PermissionsAndroid.PERMISSIONS.CAMERA,
        recordAudio: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        
        // App usage statistics (requires special handling)
        packageUsageStats: 'android.permission.PACKAGE_USAGE_STATS'
      };
    } else {
      // iOS permissions
      return {
        location: PERMISSIONS.IOS.LOCATION_ALWAYS,
        contacts: PERMISSIONS.IOS.CONTACTS,
        camera: PERMISSIONS.IOS.CAMERA,
        microphone: PERMISSIONS.IOS.MICROPHONE
      };
    }
  }

  async requestAllPermissions() {
    console.log('Requesting all required permissions...');
    
    try {
      if (Platform.OS === 'android') {
        return await this.requestAndroidPermissions();
      } else {
        return await this.requestIOSPermissions();
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async requestAndroidPermissions() {
    const permissions = Object.values(this.requiredPermissions);
    const specialPermissions = [];

    // Filter out special permissions that need different handling
    const regularPermissions = permissions.filter(permission => {
      if (permission === 'android.permission.PACKAGE_USAGE_STATS') {
        specialPermissions.push('usage_stats');
        return false;
      }
      return true;
    });

    try {
      // Request regular permissions
      console.log('Requesting regular permissions...');
      const results = await PermissionsAndroid.requestMultiple(regularPermissions);
      
      let allGranted = true;
      Object.keys(results).forEach(permission => {
        const granted = results[permission] === PermissionsAndroid.RESULTS.GRANTED;
        console.log(`${permission}: ${granted ? 'GRANTED' : 'DENIED'}`);
        if (!granted) allGranted = false;
      });

      // Handle special permissions
      for (const specialPerm of specialPermissions) {
        const granted = await this.requestSpecialPermission(specialPerm);
        if (!granted) allGranted = false;
      }

      // Request Device Administrator privileges
      const adminGranted = await this.requestDeviceAdminPermission();
      if (!adminGranted) {
        console.warn('Device admin permission not granted');
        // Don't fail completely, but warn user
      }

      return allGranted;
    } catch (error) {
      console.error('Android permissions request error:', error);
      return false;
    }
  }

  async requestIOSPermissions() {
    const permissions = Object.values(this.requiredPermissions);
    let allGranted = true;

    for (const permission of permissions) {
      try {
        const result = await request(permission);
        const granted = result === RESULTS.GRANTED;
        console.log(`${permission}: ${granted ? 'GRANTED' : 'DENIED'}`);
        if (!granted) allGranted = false;
      } catch (error) {
        console.error(`Error requesting ${permission}:`, error);
        allGranted = false;
      }
    }

    return allGranted;
  }

  async requestSpecialPermission(type) {
    switch (type) {
      case 'usage_stats':
        return await this.requestUsageStatsPermission();
      case 'device_admin':
        return await this.requestDeviceAdminPermission();
      case 'accessibility':
        return await this.requestAccessibilityPermission();
      default:
        return false;
    }
  }

  async requestUsageStatsPermission() {
    try {
      console.log('Requesting Usage Stats permission...');
      
      Alert.alert(
        'App Usage Permission Required',
        'ParentGuard needs permission to monitor app usage. This will open the system settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => false
          },
          {
            text: 'Open Settings',
            onPress: () => {
              // Open usage access settings
              Linking.openURL('android.settings.USAGE_ACCESS_SETTINGS').catch(err => {
                console.error('Failed to open usage settings:', err);
              });
            }
          }
        ]
      );

      // Return true for now - user needs to manually enable
      return true;
    } catch (error) {
      console.error('Usage stats permission error:', error);
      return false;
    }
  }

  async requestDeviceAdminPermission() {
    try {
      console.log('Requesting Device Admin permission...');
      
      Alert.alert(
        'Device Administrator Required',
        'ParentGuard needs Device Administrator privileges for advanced protection features.',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => false
          },
          {
            text: 'Enable',
            onPress: () => {
              // This would require native Android code to request device admin
              console.log('Device admin request would be handled by native code');
            }
          }
        ]
      );

      return true; // Assume granted for demo
    } catch (error) {
      console.error('Device admin permission error:', error);
      return false;
    }
  }

  async requestAccessibilityPermission() {
    try {
      console.log('Requesting Accessibility permission...');
      
      Alert.alert(
        'Accessibility Service Required',
        'ParentGuard needs Accessibility Service permissions for advanced monitoring.',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => false
          },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openURL('android.settings.ACCESSIBILITY_SETTINGS').catch(err => {
                console.error('Failed to open accessibility settings:', err);
              });
            }
          }
        ]
      );

      return true;
    } catch (error) {
      console.error('Accessibility permission error:', error);
      return false;
    }
  }

  async checkAllPermissions() {
    const permissionStatus = {};
    const permissions = Object.entries(this.requiredPermissions);

    for (const [key, permission] of permissions) {
      try {
        if (Platform.OS === 'android') {
          const result = await PermissionsAndroid.check(permission);
          permissionStatus[key] = result;
        } else {
          const result = await check(permission);
          permissionStatus[key] = result === RESULTS.GRANTED;
        }
      } catch (error) {
        console.error(`Error checking ${key} permission:`, error);
        permissionStatus[key] = false;
      }
    }

    return permissionStatus;
  }

  async openSettings() {
    try {
      if (Platform.OS === 'android') {
        await Linking.openURL('android.settings.APPLICATION_DETAILS_SETTINGS');
      } else {
        await openSettings();
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
      Alert.alert(
        'Settings Error',
        'Could not open settings. Please manually grant permissions in your device settings.'
      );
    }
  }

  getPermissionExplanations() {
    return {
      location: {
        title: 'Location Access',
        description: 'Required to track device location and set up safe zones.',
        critical: true
      },
      callLog: {
        title: 'Call Log Access', 
        description: 'Monitor incoming and outgoing calls for safety.',
        critical: true
      },
      sms: {
        title: 'SMS Access',
        description: 'Monitor text messages for inappropriate content.',
        critical: true
      },
      contacts: {
        title: 'Contacts Access',
        description: 'Identify known contacts in communications.',
        critical: false
      },
      camera: {
        title: 'Camera Access',
        description: 'Optional: Take photos remotely if needed.',
        critical: false
      },
      microphone: {
        title: 'Microphone Access',
        description: 'Optional: Record audio for safety monitoring.',
        critical: false
      },
      usageStats: {
        title: 'App Usage Statistics',
        description: 'Monitor which apps are used and for how long.',
        critical: true
      },
      deviceAdmin: {
        title: 'Device Administrator',
        description: 'Required for remote app blocking and advanced controls.',
        critical: true
      }
    };
  }

  async showPermissionExplanation(permissionType) {
    const explanations = this.getPermissionExplanations();
    const explanation = explanations[permissionType];

    if (!explanation) return;

    Alert.alert(
      explanation.title,
      explanation.description,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Grant Permission', 
          onPress: () => this.requestSinglePermission(permissionType)
        }
      ]
    );
  }

  async requestSinglePermission(permissionType) {
    const permission = this.requiredPermissions[permissionType];
    if (!permission) return false;

    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(permission);
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request(permission);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error(`Error requesting ${permissionType}:`, error);
      return false;
    }
  }

  async getMissingPermissions() {
    const status = await this.checkAllPermissions();
    const missing = [];

    Object.entries(status).forEach(([key, granted]) => {
      if (!granted) {
        missing.push(key);
      }
    });

    return missing;
  }
}

export { PermissionManager };
export default new PermissionManager();