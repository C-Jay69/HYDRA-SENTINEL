/**
 * ParentGuard Child Monitor App
 * Main Application Component
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  AppState,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
  Switch,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonitoringService } from './src/services/MonitoringService';
import { ApiService } from './src/services/ApiService';
import { PermissionManager } from './src/services/PermissionManager';
import { BackgroundService } from './src/services/BackgroundService';
import { SocialMediaMonitor } from './src/services/SocialMediaMonitor';
import { ParentalControlService } from './src/services/ParentalControlService';
import { StealthService } from './src/services/StealthService';

const App = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [stealthMode, setStealthMode] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    initializeApp();
    setupAppStateListener();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize stealth service first
      await StealthService.initialize();
      
      // Check if app is already configured
      const setupComplete = await AsyncStorage.getItem('setup_complete');
      const stealthEnabled = await AsyncStorage.getItem('stealth_mode');
      
      setIsSetup(setupComplete === 'true');
      setStealthMode(stealthEnabled === 'true');
      
      // Get device information
      const info = {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
      };
      setDeviceInfo(info);

      // Initialize monitoring if setup is complete
      if (setupComplete === 'true') {
        await startMonitoring();
      }
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' && isActive) {
        // Continue monitoring in background
        BackgroundService.start();
      } else if (nextAppState === 'active') {
        // App came to foreground
        checkConnectionStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  };

  const requestPermissions = async () => {
    try {
      const permissionsGranted = await PermissionManager.requestAllPermissions();
      
      if (permissionsGranted) {
        Alert.alert(
          'Permissions Granted',
          'ParentGuard can now protect this device. The app will run in the background.',
          [{ text: 'Continue', onPress: completeSetup }]
        );
      } else {
        Alert.alert(
          'Permissions Required',
          'ParentGuard needs all permissions to protect this device. Please grant them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => PermissionManager.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    }
  };

  const completeSetup = async () => {
    try {
      // Register device with backend
      const registered = await ApiService.registerDevice(deviceInfo);
      
      if (registered) {
        await AsyncStorage.setItem('setup_complete', 'true');
        await AsyncStorage.setItem('device_registered', 'true');
        setIsSetup(true);
        await startMonitoring();
        
        Alert.alert(
          'Setup Complete',
          'ParentGuard is now protecting this device. The app will continue running in the background.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Setup Failed', 'Could not connect to ParentGuard servers. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Setup completion error:', error);
      Alert.alert('Setup Error', 'An error occurred during setup. Please try again.');
    }
  };

  const startMonitoring = async () => {
    try {
      setIsActive(true);
      setConnectionStatus('connecting');
      
      // Start all monitoring services
      await MonitoringService.startAll();
      
      // Start social media monitoring
      await SocialMediaMonitor.startMonitoring();
      
      // Start parental control service
      await ParentalControlService.start();
      
      // Start background service
      await BackgroundService.start();
      
      setConnectionStatus('connected');
      setLastSync(new Date().toLocaleString());
      
      console.log('All monitoring services started successfully');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      setConnectionStatus('error');
      Alert.alert('Error', 'Failed to start monitoring services.');
    }
  };

  const stopMonitoring = async () => {
    try {
      setIsActive(false);
      setConnectionStatus('disconnected');
      
      await MonitoringService.stopAll();
      await SocialMediaMonitor.stopMonitoring();
      await ParentalControlService.stop();
      await BackgroundService.stop();
      
      console.log('All monitoring services stopped');
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  const toggleStealthMode = async () => {
    const newStealthMode = !stealthMode;
    setStealthMode(newStealthMode);
    await AsyncStorage.setItem('stealth_mode', newStealthMode.toString());
    
    if (newStealthMode) {
      Alert.alert(
        'Stealth Mode Enabled',
        'The app will now be hidden and run silently in the background.',
        [{ text: 'OK' }]
      );
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const connected = await ApiService.checkConnection();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#9E9E9E';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Stealth mode - minimal UI
  if (stealthMode && isSetup) {
    return (
      <View style={styles.stealthContainer}>
        <StatusBar hidden={true} />
        <View style={styles.stealthDot}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        </View>
      </View>
    );
  }

  // Setup flow
  if (!isSetup) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🛡️</Text>
            </View>
            <Text style={styles.title}>ParentGuard</Text>
            <Text style={styles.subtitle}>Child Protection Monitor</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Device Protection Setup</Text>
            <Text style={styles.infoText}>
              ParentGuard will monitor this device to keep your child safe online.
            </Text>
            
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceText}>Device: {deviceInfo.deviceName}</Text>
              <Text style={styles.deviceText}>Model: {deviceInfo.brand} {deviceInfo.model}</Text>
              <Text style={styles.deviceText}>System: {Platform.OS} {deviceInfo.systemVersion}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={requestPermissions}
          >
            <Text style={styles.setupButtonText}>Start Protection Setup</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            This app requires device administrator permissions to provide comprehensive protection.
            All data is encrypted and only accessible to authorized parents.
          </Text>
        </View>
      </View>
    );
  }

  // Main monitoring interface
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🛡️</Text>
          </View>
          <Text style={styles.title}>ParentGuard</Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {connectionStatus.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.monitoringCard}>
          <Text style={styles.cardTitle}>Protection Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.label}>Monitoring:</Text>
            <Text style={[styles.value, { color: isActive ? '#4CAF50' : '#F44336' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>Last Sync:</Text>
            <Text style={styles.value}>{lastSync || 'Never'}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>Device ID:</Text>
            <Text style={styles.value}>{deviceInfo.deviceId?.slice(0, 8)}...</Text>
          </View>
        </View>

        <View style={styles.controlsCard}>
          <Text style={styles.cardTitle}>Settings</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Stealth Mode</Text>
            <Switch
              value={stealthMode}
              onValueChange={toggleStealthMode}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={stealthMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isActive ? '#F44336' : '#4CAF50' }]}
            onPress={isActive ? stopMonitoring : startMonitoring}
          >
            <Text style={styles.controlButtonText}>
              {isActive ? 'Stop Protection' : 'Start Protection'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          ParentGuard v{deviceInfo.appVersion} • Running on {Platform.OS}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  stealthContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  stealthDot: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 4,
    height: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 15,
  },
  deviceInfo: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
  },
  deviceText: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 4,
  },
  setupButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  monitoringCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  controlsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  value: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  controlButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
    marginTop: 20,
  },
});

export default App;