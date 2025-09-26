import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileSimulator = () => {
  const [currentScreen, setCurrentScreen] = useState('setup');
  const [isSetup, setIsSetup] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0.85);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  
  // Mock monitoring data
  const [monitoringData, setMonitoringData] = useState({
    socialMediaEvents: [],
    blockedApps: ['com.tiktok.android', 'com.instagram.android'],
    locationUpdates: [],
    securityEvents: [],
    appUsage: {}
  });

  // Simulate real-time data updates
  useEffect(() => {
    if (!monitoringActive) return;

    const interval = setInterval(() => {
      // Simulate social media activity
      const socialMediaApps = ['Instagram', 'TikTok', 'WhatsApp', 'Telegram', 'Snapchat'];
      const eventTypes = ['message_received', 'story_viewed', 'post_created', 'video_watched'];
      
      const newEvent = {
        id: Date.now(),
        app: socialMediaApps[Math.floor(Math.random() * socialMediaApps.length)],
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        timestamp: new Date().toLocaleTimeString(),
        content: 'Monitored activity detected'
      };

      setMonitoringData(prev => ({
        ...prev,
        socialMediaEvents: [newEvent, ...prev.socialMediaEvents.slice(0, 9)]
      }));

      // Update last sync time
      setLastSync(new Date().toLocaleTimeString());

      // Simulate battery drain
      setBatteryLevel(prev => Math.max(0.1, prev - 0.001));
    }, 3000);

    return () => clearInterval(interval);
  }, [monitoringActive]);

  const handleSetupComplete = () => {
    setIsSetup(true);
    setCurrentScreen('monitoring');
    setMonitoringActive(true);
    setConnectionStatus('connected');
  };

  const toggleStealthMode = () => {
    setStealthMode(!stealthMode);
  };

  const simulateAppBlock = (appName) => {
    const newEvent = {
      id: Date.now(),
      type: 'app_blocked',
      app: appName,
      reason: 'Parental control restriction',
      timestamp: new Date().toLocaleTimeString()
    };

    setMonitoringData(prev => ({
      ...prev,
      securityEvents: [newEvent, ...prev.securityEvents.slice(0, 4)]
    }));
  };

  const simulateSecurityThreat = () => {
    const threats = [
      'Uninstall attempt detected',
      'Root access attempt blocked',
      'Debugging attempt detected',
      'Suspicious app installation'
    ];

    const threat = {
      id: Date.now(),
      type: 'security_threat',
      message: threats[Math.floor(Math.random() * threats.length)],
      severity: 'high',
      timestamp: new Date().toLocaleTimeString()
    };

    setMonitoringData(prev => ({
      ...prev,
      securityEvents: [threat, ...prev.securityEvents.slice(0, 4)]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#9E9E9E';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Setup Screen
  const SetupScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-sm mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">ParentGuard</h1>
          <p className="text-gray-300 text-sm">Child Protection Monitor</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4">Device Protection Setup</h2>
          <p className="text-gray-300 text-sm mb-6">
            ParentGuard will monitor this device to keep your child safe online and track their location for safety purposes.
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-sm">📱 Device Access</span>
              <span className="text-green-400 text-xs">✓ Required</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-sm">📍 Location Services</span>
              <span className="text-green-400 text-xs">✓ Required</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-sm">📞 Call & SMS Access</span>
              <span className="text-green-400 text-xs">✓ Required</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-sm">📱 App Usage Stats</span>
              <span className="text-green-400 text-xs">✓ Required</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-sm">🔐 Device Administrator</span>
              <span className="text-green-400 text-xs">✓ Required</span>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleSetupComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Start Protection Setup
        </motion.button>

        <p className="text-xs text-gray-400 text-center mt-4">
          This app requires comprehensive permissions to provide full parental monitoring capabilities.
        </p>
      </div>
    </div>
  );

  // Stealth Mode Screen
  const StealthScreen = () => (
    <div className="min-h-screen bg-black flex items-end justify-end p-2">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-1 h-1 rounded-full"
        style={{ backgroundColor: getStatusColor(connectionStatus) }}
      />
    </div>
  );

  // Main Monitoring Screen
  const MonitoringScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="font-semibold">ParentGuard</h1>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(connectionStatus) }}
                />
                <span className="text-xs text-gray-300">{connectionStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-300">{Math.round(batteryLevel * 100)}%</span>
            <div className="w-6 h-3 border border-gray-400 rounded-sm">
              <div 
                className="h-full bg-green-500 rounded-sm transition-all"
                style={{ width: `${batteryLevel * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Protection Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Monitoring:</span>
              <span className="text-green-400">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Last Sync:</span>
              <span className="text-gray-300">{lastSync}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Apps Blocked:</span>
              <span className="text-red-400">{monitoringData.blockedApps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Security Events:</span>
              <span className="text-yellow-400">{monitoringData.securityEvents.length}</span>
            </div>
          </div>
        </div>

        {/* Social Media Activity */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Recent Social Media Activity</h2>
          <div className="space-y-2">
            {monitoringData.socialMediaEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity</p>
            ) : (
              monitoringData.socialMediaEvents.slice(0, 3).map(event => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <div>
                    <span className="text-sm font-medium">{event.app}</span>
                    <p className="text-xs text-gray-400">{event.type.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs text-gray-400">{event.timestamp}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Security Events */}
        {monitoringData.securityEvents.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-semibold mb-3 text-yellow-400">Security Alerts</h2>
            <div className="space-y-2">
              {monitoringData.securityEvents.slice(0, 3).map(event => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-2 bg-yellow-900 bg-opacity-30 rounded border border-yellow-600"
                >
                  <div>
                    <span className="text-sm font-medium text-yellow-400">{event.message || event.reason}</span>
                    <p className="text-xs text-gray-400">{event.app && `App: ${event.app}`}</p>
                  </div>
                  <span className="text-xs text-gray-400">{event.timestamp}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Stealth Mode</span>
              <button
                onClick={toggleStealthMode}
                className={`w-12 h-6 rounded-full transition-colors ${
                  stealthMode ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  stealthMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Demo Actions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3 text-cyan-400">Demo Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => simulateAppBlock('TikTok')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded transition-colors"
            >
              Block TikTok
            </button>
            <button
              onClick={() => simulateAppBlock('Instagram')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded transition-colors"
            >
              Block Instagram
            </button>
            <button
              onClick={simulateSecurityThreat}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-2 px-3 rounded transition-colors"
            >
              Security Alert
            </button>
            <button
              onClick={() => setCurrentScreen('setup')}
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            ParentGuard Mobile Monitor v1.0.0 • Android Simulator
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Frame */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-80 h-[640px] bg-black rounded-[2.5rem] p-2 shadow-2xl">
            <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
              {/* Screen Content */}
              <AnimatePresence mode="wait">
                {!isSetup ? (
                  <motion.div
                    key="setup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SetupScreen />
                  </motion.div>
                ) : stealthMode ? (
                  <motion.div
                    key="stealth"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <StealthScreen />
                  </motion.div>
                ) : (
                  <motion.div
                    key="monitoring"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MonitoringScreen />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Phone Details */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs">
              Child's Device Simulator
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="ml-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ParentGuard Mobile App Simulator
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🔍 Features Demonstrated:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Social media monitoring (Instagram, TikTok, WhatsApp, etc.)</li>
                <li>• Real-time location tracking</li>
                <li>• App blocking and parental controls</li>
                <li>• Stealth mode with app hiding</li>
                <li>• Security threat detection</li>
                <li>• Background monitoring service</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📱 Current Status:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Setup Complete:</span>
                  <span className={isSetup ? 'text-green-600' : 'text-red-600'}>
                    {isSetup ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stealth Mode:</span>
                  <span className={stealthMode ? 'text-blue-600' : 'text-gray-600'}>
                    {stealthMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monitoring:</span>
                  <span className={monitoringActive ? 'text-green-600' : 'text-red-600'}>
                    {monitoringActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span style={{ color: getStatusColor(connectionStatus) }}>
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                This simulator demonstrates the mobile app interface and functionality. 
                The actual mobile app would require native Android/iOS compilation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSimulator;