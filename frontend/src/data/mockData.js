// Mock data for the ParentGuard application

export const mockUser = {
  id: "user_123",
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
  subscription: "Premium",
  joinDate: "2024-01-15",
  children: [
    {
      id: "child_1",
      name: "Emma Johnson",
      age: 14,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      device: "iPhone 15",
      status: "online",
      lastSeen: new Date().toISOString()
    },
    {
      id: "child_2", 
      name: "Alex Johnson",
      age: 12,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      device: "Samsung Galaxy S24",
      status: "offline",
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]
};

export const mockCallLogs = [
  {
    id: "call_1",
    childId: "child_1",
    type: "incoming",
    contact: "Mom",
    number: "+1 (555) 123-4567",
    duration: "00:05:32",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "answered"
  },
  {
    id: "call_2", 
    childId: "child_1",
    type: "outgoing",
    contact: "Jake Miller",
    number: "+1 (555) 987-6543",
    duration: "00:12:45",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "answered"
  },
  {
    id: "call_3",
    childId: "child_2",
    type: "incoming", 
    contact: "Unknown",
    number: "+1 (555) 456-7890",
    duration: "00:00:00",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: "missed"
  }
];

export const mockMessages = [
  {
    id: "msg_1",
    childId: "child_1",
    type: "sms",
    contact: "Jake Miller",
    number: "+1 (555) 987-6543",
    content: "Hey Emma! Are we still on for the movie tonight?",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    direction: "incoming"
  },
  {
    id: "msg_2",
    childId: "child_1", 
    type: "sms",
    contact: "Jake Miller",
    number: "+1 (555) 987-6543",
    content: "Yes! Meet at 7pm at the mall entrance",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    direction: "outgoing"
  },
  {
    id: "msg_3",
    childId: "child_1",
    type: "whatsapp",
    contact: "Sophie Chen",
    content: "OMG did you see what happened at school today?? 😱",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    direction: "incoming"
  }
];

export const mockLocations = [
  {
    id: "loc_1",
    childId: "child_1",
    latitude: 40.7128,
    longitude: -74.0060,
    address: "Madison High School, New York, NY",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    accuracy: 10
  },
  {
    id: "loc_2",
    childId: "child_1", 
    latitude: 40.7589,
    longitude: -73.9851,
    address: "Central Park, New York, NY",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    accuracy: 15
  },
  {
    id: "loc_3",
    childId: "child_2",
    latitude: 40.7614,
    longitude: -73.9776,
    address: "Home - 123 Main St, New York, NY",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    accuracy: 5
  }
];

export const mockApps = [
  {
    id: "app_1",
    childId: "child_1",
    name: "Instagram",
    packageName: "com.instagram.android", 
    icon: "📷",
    category: "Social",
    timeSpent: "02:45:30",
    launches: 23,
    lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    blocked: false,
    timeLimit: "03:00:00"
  },
  {
    id: "app_2",
    childId: "child_1",
    name: "TikTok",
    packageName: "com.zhiliaoapp.musically",
    icon: "🎵",
    category: "Social",
    timeSpent: "04:12:15", 
    launches: 45,
    lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    blocked: false,
    timeLimit: "02:00:00",
    exceeded: true
  },
  {
    id: "app_3",
    childId: "child_1",
    name: "Snapchat",
    packageName: "com.snapchat.android",
    icon: "👻",
    category: "Social",
    timeSpent: "00:00:00",
    launches: 0,
    lastUsed: null,
    blocked: true,
    timeLimit: "00:30:00"
  }
];

export const mockWebHistory = [
  {
    id: "web_1",
    childId: "child_1",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Study Music - Lofi Hip Hop Beats",
    domain: "youtube.com",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    category: "Entertainment",
    blocked: false
  },
  {
    id: "web_2", 
    childId: "child_1",
    url: "https://www.khanacademy.org/math/algebra",
    title: "Algebra Basics | Khan Academy",
    domain: "khanacademy.org",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: "Education",
    blocked: false
  },
  {
    id: "web_3",
    childId: "child_2",
    url: "https://blocked-site.com",
    title: "Inappropriate Content Site",
    domain: "blocked-site.com", 
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    category: "Adult",
    blocked: true
  }
];

export const mockAlerts = [
  {
    id: "alert_1",
    childId: "child_1",
    type: "location",
    severity: "medium",
    title: "Left Safe Zone",
    description: "Emma has left the school area",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: "Madison High School, New York, NY"
    }
  },
  {
    id: "alert_2",
    childId: "child_1", 
    type: "app",
    severity: "low",
    title: "Time Limit Exceeded",
    description: "TikTok usage exceeded daily limit of 2 hours",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    read: false,
    app: "TikTok"
  },
  {
    id: "alert_3",
    childId: "child_2",
    type: "web",
    severity: "high", 
    title: "Blocked Site Access",
    description: "Attempted to access inappropriate content",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: true,
    url: "blocked-site.com"
  }
];

export const mockAdminData = {
  totalUsers: 12567,
  activeDevices: 23891,
  alertsToday: 1432,
  subscriptionRevenue: 2845632,
  userGrowth: 12.5,
  deviceGrowth: 8.3,
  alertGrowth: -2.1,
  revenueGrowth: 15.7,
  
  usersByPlan: [
    { plan: "Basic", count: 4523, revenue: 135690 },
    { plan: "Premium", count: 6789, revenue: 474923 },
    { plan: "Family", count: 1255, revenue: 125500 }
  ],
  
  topAlerts: [
    { type: "Location", count: 523 },
    { type: "App Usage", count: 412 },
    { type: "Web Blocking", count: 289 },
    { type: "Time Limits", count: 208 }
  ],
  
  deviceTypes: [
    { type: "iOS", count: 14234 },
    { type: "Android", count: 9657 }
  ]
};

export const mockGeofences = [
  {
    id: "geo_1",
    childId: "child_1",
    name: "School",
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 200,
    type: "safe",
    active: true,
    notifications: true
  },
  {
    id: "geo_2",
    childId: "child_1",
    name: "Home", 
    latitude: 40.7614,
    longitude: -73.9776,
    radius: 100,
    type: "safe",
    active: true,
    notifications: false
  }
];

export const mockContacts = [
  {
    id: "contact_1",
    childId: "child_1",
    name: "Mom",
    number: "+1 (555) 123-4567",
    email: "mom@family.com",
    relationship: "parent",
    blocked: false,
    emergencyContact: true
  },
  {
    id: "contact_2",
    childId: "child_1", 
    name: "Jake Miller",
    number: "+1 (555) 987-6543",
    relationship: "friend",
    blocked: false,
    emergencyContact: false
  },
  {
    id: "contact_3",
    childId: "child_1",
    name: "Unknown Caller",
    number: "+1 (555) 456-7890", 
    relationship: "unknown",
    blocked: true,
    emergencyContact: false
  }
];