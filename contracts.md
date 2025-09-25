# ParentGuard API Contracts & Integration Plan

## 1. API Endpoints Structure

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (JWT)
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/children` - Get user's children list
- `POST /api/users/children` - Add new child
- `PUT /api/users/children/:childId` - Update child info
- `DELETE /api/users/children/:childId` - Remove child

### Monitoring Data Endpoints
- `GET /api/monitoring/:childId/calls` - Get call logs
- `GET /api/monitoring/:childId/messages` - Get messages
- `GET /api/monitoring/:childId/locations` - Get location history
- `GET /api/monitoring/:childId/apps` - Get app usage data
- `GET /api/monitoring/:childId/web` - Get web history
- `GET /api/monitoring/:childId/alerts` - Get alerts
- `POST /api/monitoring/:childId/alerts/:alertId/read` - Mark alert as read
- `DELETE /api/monitoring/:childId/alerts/:alertId` - Dismiss alert

### Control & Settings
- `POST /api/control/:childId/block-app` - Block/unblock app
- `POST /api/control/:childId/block-website` - Block website
- `PUT /api/control/:childId/geofence` - Update geofence settings
- `GET /api/control/:childId/settings` - Get child control settings
- `PUT /api/control/:childId/settings` - Update control settings

### Admin Endpoints
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/stats` - Get platform statistics
- `PUT /api/admin/users/:userId/status` - Update user status
- `GET /api/admin/alerts/overview` - Get alerts overview
- `GET /api/admin/revenue` - Get revenue analytics

## 2. Database Models

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  avatar: String,
  subscription: String, // 'Basic', 'Premium', 'Family'
  googleId: String,
  joinDate: Date,
  isActive: Boolean,
  lastLogin: Date
}
```

### Children Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  age: Number,
  avatar: String,
  device: String,
  deviceId: String,
  status: String, // 'online', 'offline'
  lastSeen: Date,
  createdAt: Date
}
```

### Monitoring Data Collections
- `call_logs` - Call history data
- `messages` - SMS/messaging data
- `locations` - GPS location data
- `app_usage` - Application usage statistics
- `web_history` - Web browsing history
- `alerts` - System alerts and notifications

## 3. Mock Data Replacement Plan

### Frontend Components to Update:
1. **Dashboard.jsx** - Replace mockUser, mockCallLogs, mockMessages, etc. with API calls
2. **Landing.jsx** - Add real authentication flows
3. **App.js** - Add authentication context and protected routes

### Mock Data Files to Replace:
- `/data/mockData.js` - Will be replaced with API service calls
- Static data arrays will become dynamic API responses

## 4. Frontend-Backend Integration

### Authentication Flow:
1. User registers/logs in via `/auth/login` or `/auth/google`
2. JWT token stored in localStorage
3. Protected routes check authentication status
4. Token included in all API requests via Authorization header

### Data Flow:
1. Dashboard loads user profile and children list
2. Child selection triggers monitoring data API calls
3. Real-time updates via WebSocket connections (future enhancement)
4. Alert system integrated with backend notification system

### API Service Layer:
- Create `/src/services/api.js` - Centralized API client
- Create `/src/context/AuthContext.js` - Authentication state management
- Create `/src/hooks/useAuth.js` - Authentication hooks

## 5. Implementation Strategy

### Phase 1: Authentication & User Management
- JWT authentication system
- Google OAuth integration
- User registration/login pages
- Protected route implementation

### Phase 2: Core Monitoring APIs
- Database models and CRUD operations
- Monitoring data endpoints
- Dashboard integration with real data

### Phase 3: Control Features
- App/website blocking functionality
- Geofencing and location alerts
- Control settings management

### Phase 4: Admin Panel
- Admin authentication and authorization
- User management interface
- Analytics and reporting system
- Revenue and subscription management

## 6. Security Considerations
- JWT token expiration and refresh
- Route protection middleware
- Input validation and sanitization
- Role-based access control (User/Admin)
- API rate limiting
- CORS configuration

## 7. Brand Color Integration
- Primary Blue: #0000FF (buttons, highlights)
- Gold: #FFBF00 (premium features, badges)
- Magenta: #FF00FF (alert indicators)
- Cyan: #00FFFF (live status indicators)
- Light Gray: #DCDFD5 (backgrounds, subtle elements)