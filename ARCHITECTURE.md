# GoalPath - System Architecture & Design Document

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Native Mobile App (iOS & Android)                 │  │
│  │  - Authentication Flow                                    │  │
│  │  - Goal Management                                        │  │
│  │  - Habit Tracking                                         │  │
│  │  - Progress Dashboard                                     │  │
│  │  - Analytics & Notifications                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │ HTTPS/REST API
┌─────────────────────▼──────────────────────────────────────────┐
│                      API LAYER                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js/Express Server                                  │  │
│  │  - Authentication & Authorization                        │  │
│  │  - RESTful API Endpoints                                 │  │
│  │  - Request Validation                                    │  │
│  │  - Business Logic                                        │  │
│  │  - Notification Service                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │ Database Protocol
┌─────────────────────▼──────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MongoDB (NoSQL Database)                                │  │
│  │  - Users Collection                                      │  │
│  │  - Goals Collection                                      │  │
│  │  - Milestones Collection                                 │  │
│  │  - Habits Collection                                     │  │
│  │  - Tracking Records Collection                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│  - Push Notifications (Expo Notifications / FCM)                 │
│  - Email Service (SendGrid or Resend)                            │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Mobile App Architecture (React Native)

```
App.tsx (Entry Point)
├── Navigation Stack
│   ├── Auth Stack (unauthenticated users)
│   │   ├── SignUp Screen
│   │   ├── SignIn Screen
│   │   └── Onboarding Screen
│   └── App Stack (authenticated users)
│       ├── Home Tab (Dashboard)
│       ├── Goals Tab
│       ├── Habits Tab
│       ├── Analytics Tab
│       └── Profile Tab
│
├── State Management (Redux/Zustand)
│   ├── Auth State (user, token)
│   ├── Goals State (goals, filters)
│   ├── Habits State (habits, logs)
│   └── UI State (loading, errors)
│
├── Services
│   ├── API Client (axios + interceptors)
│   ├── Authentication Service
│   ├── Local Storage Service
│   └── Push Notification Service
│
├── Screens
├── Components
├── Hooks
├── Utils
└── Assets (images, fonts, colors)
```

## 3. Backend Architecture (Node.js/Express)

```
server.js (Entry Point)
├── Middleware
│   ├── Authentication (JWT verification)
│   ├── Authorization (role-based access)
│   ├── Error Handling
│   ├── Request Logging
│   └── CORS
│
├── Routes
│   ├── /api/auth (signup, login, refresh)
│   ├── /api/users (profile management)
│   ├── /api/goals (CRUD operations)
│   ├── /api/milestones (CRUD + completion)
│   ├── /api/habits (CRUD + logging)
│   ├── /api/analytics (progress metrics)
│   └── /api/notifications (preferences)
│
├── Controllers
│   ├── AuthController
│   ├── UserController
│   ├── GoalController
│   ├── MilestoneController
│   ├── HabitController
│   └── AnalyticsController
│
├── Models (Mongoose schemas)
│   ├── User
│   ├── Goal
│   ├── Milestone
│   ├── Habit
│   └── TrackingRecord
│
├── Services (Business Logic)
│   ├── AuthService
│   ├── GoalService
│   ├── NotificationService
│   └── AnalyticsService
│
├── Utils
│   ├── JWT Token Management
│   ├── Password Hashing
│   └── Error Handling
│
└── Config
    ├── Database Connection
    └── Environment Variables
```

## 4. Data Flow

### User Authentication Flow
```
User Input (Email/Password)
    ↓
Mobile App → POST /api/auth/signup
    ↓
Backend validates input
    ↓
Hash password + create user in MongoDB
    ↓
Generate JWT token
    ↓
Return token to app
    ↓
App stores token in secure storage
    ↓
App includes token in all subsequent requests
```

### Goal Creation & Tracking Flow
```
User creates goal
    ↓
Mobile App → POST /api/goals
    ↓
Backend validates + creates goal document
    ↓
Returns goal with milestones
    ↓
User logs daily habit completions
    ↓
Mobile App → POST /api/habits/log
    ↓
Backend updates tracking records
    ↓
Calculates progress metrics
    ↓
App displays updated analytics
```

### Push Notification Flow
```
Backend scheduled job (cron)
    ↓
Checks for habits/reminders due
    ↓
Filters users based on notification preferences
    ↓
Sends push notification via Expo/FCM
    ↓
Mobile app receives notification
    ↓
User taps notification → navigates to relevant screen
```

## 5. Security Architecture

### Authentication & Authorization
- **JWT Tokens:** Access token (1 hour) + Refresh token (30 days)
- **Password Security:** bcrypt with 12 rounds
- **HTTPS:** All communications encrypted
- **CORS:** Restricted to mobile app domains
- **Rate Limiting:** 100 requests per minute per IP

### Data Protection
- **User data:** Only accessible by authenticated owner
- **Sensitive fields:** Password never returned in API responses
- **Database:** MongoDB Atlas with IP whitelist
- **Environment variables:** Secrets stored securely (never in code)

### Validation & Sanitization
- **Input validation:** Joi schema validation on all endpoints
- **SQL injection:** Not applicable (using MongoDB)
- **XSS prevention:** Input sanitization on text fields
- **CSRF protection:** Token-based approach (not needed for stateless API)

## 6. Performance Architecture

### Frontend Optimization
- **Code Splitting:** Lazy loading screens/components
- **Image Optimization:** Compressed & responsive images
- **State Management:** Efficient Redux selectors
- **Memoization:** React.memo for expensive components
- **Network:** Caching strategy (AsyncStorage + Redux persist)

### Backend Optimization
- **Database Indexing:** Indexes on frequently queried fields
- **Pagination:** Large result sets paginated (20 items per page)
- **Caching:** Redis for frequently accessed data (optional upgrade)
- **Query Optimization:** Lean MongoDB queries (select only needed fields)
- **Load Testing:** Verified to handle 1000+ concurrent users

### Monitoring & Analytics
- **Error Tracking:** Sentry or LogRocket
- **Performance Monitoring:** APM (Application Performance Monitoring)
- **User Analytics:** Segment or custom implementation
- **API Metrics:** Response times, error rates, throughput

## 7. Scalability Considerations

### Horizontal Scaling
- **Stateless API:** Can run multiple instances behind load balancer
- **Database Sharding:** MongoDB Atlas handles this automatically
- **CDN:** Assets served via CloudFlare or similar

### Vertical Scaling
- **Node.js Clustering:** Use all CPU cores
- **Database Optimization:** Connection pooling, query optimization
- **Caching Layer:** Redis for hot data

### Cost Optimization
- **Free Tier Services:** MongoDB Atlas free tier (512MB storage)
- **Serverless Option:** AWS Lambda + API Gateway (future upgrade)
- **Content Delivery:** Expo's CDN for mobile assets

## 8. Deployment Architecture

```
Development
    ↓ git push
GitHub Repository
    ↓ CI/CD Pipeline (optional)
Heroku / Railway (Backend)
    ↓
Expo Build Cloud (Mobile)
    ↓
TestFlight (iOS) + Google Play Internal Testing (Android)
    ↓
App Store + Google Play (Production)
```

## 9. Error Handling & Recovery

### API Error Responses
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "email": "Email must be a valid email address"
    }
  }
}
```

### Offline Support (Mobile)
- Local SQLite database for goals, habits, milestones
- Sync to backend when connection restored
- Optimistic UI updates during offline usage

### Retry Strategy
- Exponential backoff for failed network requests
- Max 3 retries with 1s, 2s, 4s delays
- User notified if persistent failures occur

## 10. Testing Strategy

### Backend Testing
- **Unit Tests:** Controllers, services, utilities (Jest)
- **Integration Tests:** API endpoints with mock database
- **Load Testing:** Verify KPI compliance (<500ms response)

### Frontend Testing
- **Unit Tests:** Components, hooks, utilities
- **Integration Tests:** Navigation, state management
- **E2E Tests:** Critical user journeys (optional)

### Manual Testing
- Device testing (iOS simulator + Android emulator)
- Real device testing before submission
- Edge cases: network failures, offline mode, token expiration
