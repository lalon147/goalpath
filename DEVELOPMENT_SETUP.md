# GoalPath Development Environment Setup

## Prerequisites

Before starting, ensure you have:

### System Requirements
- **Node.js:** v16+ (v18 recommended)
- **npm:** v8+ or **yarn** v3+
- **Git:** v2.30+
- **Mobile Development:**
  - iOS: Xcode 12+ (Mac only) or use Expo cloud build
  - Android: Android Studio 4.1+ or use Expo cloud build
  - **Recommended:** Use Expo for faster setup (no native compilation needed)

### Developer Accounts
- GitHub account (for version control)
- MongoDB Atlas account (free tier)
- Expo account (free tier - for cloud builds)
- Optional: Heroku account (for backend deployment)

---

## 1. Backend Setup (Node.js/Express)

### 1.1 Create Project Structure

```bash
# Create backend directory
mkdir goalpath-backend
cd goalpath-backend

# Initialize Node.js project
npm init -y
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install express@4.18.2
npm install mongoose@7.0.0
npm install bcryptjs@2.4.3
npm install jsonwebtoken@9.0.0
npm install joi@17.9.0
npm install cors@2.8.5
npm install dotenv@16.0.3

# Development dependencies
npm install --save-dev nodemon@2.0.20
npm install --save-dev jest@29.5.0
npm install --save-dev supertest@6.3.3

# Optional: Logging and monitoring
npm install winston@3.8.2
npm install express-rate-limit@6.7.0
```

### 1.3 Create .env File

Create `.env` file in backend root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/goalpath_db?retryWrites=true&w=majority

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_generated_access_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:19006,http://localhost:8081,exp://localhost:19000

# Encryption
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 1.4 Generate JWT Secrets

```bash
# Run this in your terminal to generate secure secrets
node -e "console.log('Access Secret:', require('crypto').randomBytes(32).toString('hex')); console.log('Refresh Secret:', require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated values to `.env`

### 1.5 Create Folder Structure

```
goalpath-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── goalController.js
│   │   ├── habitController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Goal.js
│   │   ├── Milestone.js
│   │   ├── Habit.js
│   │   └── HabitLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── goals.js
│   │   ├── habits.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── goalService.js
│   │   └── analyticsService.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── errors.js
│   └── server.js
├── tests/
│   └── (Jest test files)
├── .env
├── .gitignore
├── package.json
└── README.md
```

### 1.6 package.json Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "lint": "eslint src/"
  }
}
```

### 1.7 .gitignore

Create `.gitignore`:

```
node_modules/
.env
.env.local
.DS_Store
*.log
npm-debug.log*
.idea/
.vscode/
coverage/
dist/
build/
```

---

## 2. Mobile Setup (React Native/Expo)

### 2.1 Create Expo Project

```bash
# Create new Expo project
npx create-expo-app@latest goalpath-mobile
cd goalpath-mobile

# Or if you want more control:
npx create-expo-app@latest goalpath-mobile --template
```

### 2.2 Install Mobile Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated

# State Management
npm install @reduxjs/toolkit react-redux

# HTTP Client
npm install axios

# UI Components
npm install react-native-paper

# Charts
npm install react-native-chart-kit

# Storage
npm install @react-native-async-storage/async-storage

# Notifications
npm install expo-notifications expo-permissions

# Date/Time
npm install react-native-date-picker date-fns

# Icons
npm install react-native-vector-icons

# Development
npm install --save-dev @babel/preset-typescript typescript
```

### 2.3 Create .env File

Create `.env` in mobile root:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_API_TIMEOUT=10000

# Environment
EXPO_PUBLIC_ENV=development

# Feature Flags
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

### 2.4 Folder Structure

```
goalpath-mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SignInScreen.js
│   │   │   ├── SignUpScreen.js
│   │   │   └── OnboardingScreen.js
│   │   ├── home/
│   │   │   └── HomeScreen.js
│   │   ├── goals/
│   │   │   ├── GoalsListScreen.js
│   │   │   ├── GoalDetailScreen.js
│   │   │   └── CreateGoalScreen.js
│   │   ├── habits/
│   │   │   ├── HabitsListScreen.js
│   │   │   ├── HabitDetailScreen.js
│   │   │   └── LogHabitScreen.js
│   │   ├── analytics/
│   │   │   └── AnalyticsScreen.js
│   │   └── profile/
│   │       └── ProfileScreen.js
│   ├── components/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Header.js
│   │   ├── ProgressBar.js
│   │   └── (other UI components)
│   ├── navigation/
│   │   ├── AuthNavigator.js
│   │   ├── AppNavigator.js
│   │   └── RootNavigator.js
│   ├── redux/
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── goalsSlice.js
│   │   │   ├── habitsSlice.js
│   │   │   └── uiSlice.js
│   │   ├── store.js
│   │   └── hooks.js
│   ├── services/
│   │   ├── api.js (Axios instance)
│   │   ├── auth.js (API calls)
│   │   ├── goals.js (API calls)
│   │   └── habits.js (API calls)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useGoals.js
│   │   └── useLocalStorage.js
│   ├── utils/
│   │   ├── colors.js (Design system)
│   │   ├── spacing.js
│   │   ├── formatters.js
│   │   └── validation.js
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── constants/
│   │   ├── colors.js
│   │   ├── categories.js
│   │   └── messages.js
│   └── App.js (Entry point)
├── app.json (Expo config)
├── .env
├── .gitignore
├── package.json
└── README.md
```

### 2.5 app.json Configuration

Edit `app.json`:

```json
{
  "expo": {
    "name": "GoalPath",
    "slug": "goalpath",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": ["expo-notifications"],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.goalpath.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.goalpath.app"
    }
  }
}
```

### 2.6 .gitignore

```
node_modules/
.env
.env.local
.expo/
.expo-shared/
dist/
npm-debug.log*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
```

---

## 3. MongoDB Atlas Setup

### 3.1 Create Free Cluster

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Sign up for free account
3. Create new project
4. Create free M0 cluster
5. Choose region closest to you

### 3.2 Create Database User

1. Go to Database Access → Add User
2. **Username:** `goalpath_user`
3. **Password:** Generate strong password (save it)
4. Select role: `readWrite`

### 3.3 Setup IP Whitelist

1. Go to Network Access
2. Add IP address `0.0.0.0/0` (allows all IPs - for development only)
3. For production: add specific IPs

### 3.4 Get Connection String

1. Go to Clusters → Connect
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<username>` and `<password>`
5. Add to `.env` as `MONGODB_URI`

Example:
```
mongodb+srv://goalpath_user:your_password@cluster0.xxxxx.mongodb.net/goalpath_db?retryWrites=true&w=majority
```

---

## 4. Git Setup

### 4.1 Initialize Repository

```bash
# Create root directory
mkdir goalpath-project
cd goalpath-project

# Initialize git
git init

# Create .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".DS_Store" >> .gitignore
```

### 4.2 Repository Structure

```
goalpath-project/
├── backend/              (Node.js/Express)
├── mobile/               (React Native/Expo)
├── docs/                 (Documentation)
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   └── DESIGN_SYSTEM.md
└── README.md
```

---

## 5. Local Development Workflow

### 5.1 Start Backend

```bash
# From backend directory
npm install
npm run dev

# Backend should run on http://localhost:3000
```

### 5.2 Start Mobile (Expo)

```bash
# From mobile directory
npm install
npm start

# Press 'i' for iOS simulator (Mac only)
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app on physical device
```

### 5.3 Test API Endpoints

```bash
# Using curl
curl -X GET http://localhost:3000/api/health

# Or use Postman/Insomnia
# Import API_SPECIFICATION.md endpoints
```

---

## 6. Essential Commands Reference

### Backend Commands
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

### Mobile Commands
```bash
# Start Expo development server
npm start

# Eject from Expo (one-way - be careful!)
npm run eject

# Build for production
npm run build:web

# Generate native builds
eas build
```

---

## 7. Troubleshooting

### Port Already in Use
```bash
# Backend (port 3000)
lsof -i :3000
kill -9 <PID>

# Mobile (port 19006)
lsof -i :19006
kill -9 <PID>
```

### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### MongoDB Connection Issues
```bash
# Verify connection string in .env
# Check IP whitelist in MongoDB Atlas
# Test connection:
mongosh "your_connection_string"
```

### Expo Issues
```bash
# Clear cache
expo start --clear
expo start -c

# Reset project
rm -rf .expo
expo start
```

---

## 8. IDE Setup (VS Code Recommended)

### 8.1 Recommended Extensions

- ESLint
- Prettier
- Thunder Client or REST Client (for API testing)
- ES7+ React/Redux/React-Native snippets
- MongoDB for VS Code

### 8.2 .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 9. Environment Configuration Summary

### Development
```
Backend:  http://localhost:3000
Mobile:   http://localhost:19006 (web preview)
Database: MongoDB Atlas free tier
```

### Production (Will configure later)
```
Backend:  https://goalpath-api.herokuapp.com
Mobile:   Testflight + Google Play
Database: MongoDB Atlas
```

---

## Next Steps

1. ✅ Clone/create repositories
2. ✅ Run setup commands above
3. ✅ Verify all services start without errors
4. ✅ Test database connection
5. ➡️ Proceed to Day 2: Backend development

You're ready for Day 2! Let me know when you've completed setup and we'll start building the API.
