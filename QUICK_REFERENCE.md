# GoalPath - Day 1 Quick Reference Guide

## 📋 What You Have

### 7 Complete Documents Ready
```
1. EXECUTION_PLAN.md          → Full 12 week sprint breakdown
2. ARCHITECTURE.md             → System design & security
3. DATABASE_SCHEMA.md          → MongoDB collections & queries
4. API_SPECIFICATION.md        → All 30+ endpoints documented
5. DESIGN_SYSTEM.md            → UI components & wireframes
6. DEVELOPMENT_SETUP.md        → Environment setup guide
7. DAY_1_SUMMARY.md            → What's been accomplished
```

---

## 🎯 Quick System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    GOALPATH SYSTEM                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📱 MOBILE (React Native + Expo)                             │
│  ├─ Authentication Screens                                   │
│  ├─ Dashboard (Goals, Habits, Analytics)                     │
│  ├─ Goal Management                                          │
│  ├─ Habit Tracking & Logging                                 │
│  └─ Progress Analytics                                       │
│         ↕ HTTPS/REST API                                    │
│  🖥️ BACKEND (Node.js + Express)                             │
│  ├─ Authentication (JWT)                                     │
│  ├─ Goals CRUD                                               │
│  ├─ Milestones CRUD                                          │
│  ├─ Habits CRUD & Logging                                    │
│  ├─ Analytics Calculation                                    │
│  └─ Notifications                                            │
│         ↕ Database Protocol                                  │
│  💾 DATABASE (MongoDB Atlas)                                 │
│  ├─ Users (auth & profiles)                                  │
│  ├─ Goals (with categories & status)                         │
│  ├─ Milestones (checkpoints for goals)                       │
│  ├─ Habits (daily/weekly recurring)                          │
│  ├─ HabitLogs (tracking records)                             │
│  └─ Notifications (user messaging)                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone & Setup
```bash
# Create project structure
mkdir goalpath-project
cd goalpath-project
git init

# Create backend
mkdir backend
cd backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken joi cors dotenv

# Create mobile (from project root)
cd ..
npx create-expo-app@latest mobile
cd mobile
npm install @react-navigation/native axios @reduxjs/toolkit react-redux
```

### 2. Create .env Files

**backend/.env**
```env
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/goalpath_db
JWT_ACCESS_SECRET=your_secret_here
```

**mobile/.env**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Test Setup
```bash
# Backend
cd backend && npm run dev    # Should start on :3000

# Mobile (new terminal)
cd mobile && npm start       # Should show Expo menu
```

---

## 📊 Data Model Quick Reference

### Core Collections (6 Total)

```
USERS
├─ _id, email, password (bcrypt), firstName, lastName
├─ timezone, preferences, emailVerified
└─ createdAt, updatedAt

GOALS (belongs to User)
├─ _id, userId, title, description, category
├─ status, priority, completionPercentage
├─ targetDate, milestones[], habits[]
└─ createdAt, updatedAt

MILESTONES (belongs to Goal)
├─ _id, goalId, title, status
├─ targetDate, completedDate, order
└─ reward, createdAt

HABITS (belongs to User + Goal)
├─ _id, userId, goalId, title
├─ frequency, daysOfWeek, currentStreak, longestStreak
├─ status, reminders[], totalCompletions
└─ createdAt, updatedAt

HABITLOGS (belongs to Habit)
├─ _id, habitId, userId, logDate
├─ status (completed/skipped), duration, intensity
├─ notes, loggedAt
└─ createdAt

NOTIFICATIONS (belongs to User)
├─ _id, userId, type (milestone, streak, reminder)
├─ title, message, status (unread/read)
├─ relatedGoalId, relatedHabitId
└─ createdAt
```

---

## 🔑 Key Features Map

### Feature → Collection Mapping

| Feature | Collections Used |
|---------|------------------|
| User Registration | Users |
| Goal Creation | Goals + Habits + Milestones |
| Daily Habit Logging | HabitLogs + Habits |
| Progress Tracking | HabitLogs + Goals + Milestones |
| Notifications | Notifications + Habits + Milestones |
| Analytics | HabitLogs + Goals aggregation |

---

## 📡 API Endpoints Quick Reference

### Authentication
```
POST   /auth/signup              → Create user + return JWT
POST   /auth/signin              → Login + return JWT
POST   /auth/refresh             → Get new access token
POST   /auth/logout              → Invalidate token
```

### Goals
```
POST   /goals                    → Create goal
GET    /goals                    → List user's goals
GET    /goals/{id}               → Get goal details
PUT    /goals/{id}               → Update goal
DELETE /goals/{id}               → Delete goal
```

### Habits
```
POST   /habits                   → Create habit
GET    /habits                   → List habits
POST   /habits/{id}/log          → Log completion
GET    /habits/{id}/logs         → Get logs (last 30 days)
```

### Analytics
```
GET    /analytics/dashboard      → Overview stats
GET    /analytics/goals/{id}     → Goal progress
GET    /analytics/habits/{id}    → Habit statistics
```

**Total Endpoints:** 30+ (fully specified in API_SPECIFICATION.md)

---

## 🎨 Design Colors

### Primary Palette
```
Primary Blue:    #3B82F6  (buttons, active states)
Accent Green:    #10B981  (success, completion)
Warning Orange:  #F97316  (alerts, reminders)
Danger Red:      #EF4444  (destructive actions)
```

### Category Colors
```
Learning:   #8B5CF6  (Purple)
Health:     #EF4444  (Red)
Career:     #3B82F6  (Blue)
Personal:   #EC4899  (Pink)
Financial:  #F59E0B  (Amber)
```

---

## 📱 Screen Structure

### Navigation Stack
```
App Entry
├─ Auth Stack (unauthenticated)
│  ├─ Sign In
│  ├─ Sign Up
│  └─ Onboarding
│
└─ App Stack (authenticated)
   └─ Bottom Tab Navigation
      ├─ Home (Dashboard)
      ├─ Goals (CRUD + Details)
      ├─ Habits (List + Log)
      ├─ Analytics (Charts)
      └─ Profile (Settings)
```

---

## ✅ Pre-Development Checklist

- [ ] Create backend folder with Express setup
- [ ] Create mobile folder with Expo setup
- [ ] Create .env files (don't commit!)
- [ ] Test: Backend starts on :3000
- [ ] Test: Mobile Expo server starts
- [ ] MongoDB Atlas cluster created & connection string ready
- [ ] Git initialized with .gitignore
- [ ] Node.js v16+ installed
- [ ] npm/yarn installed

---

## 🔐 Security Quick Checklist

✅ JWT tokens (access + refresh)  
✅ Password hashing (bcrypt, 12 rounds)  
✅ Input validation (Joi)  
✅ CORS configured  
✅ Rate limiting ready  
✅ HTTPS enforced (production)  
✅ Environment secrets (never in code)  
✅ User-scoped data access  

---

## 📈 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| API Response | <500ms | Indexed queries, pagination |
| Screen Load | <2s | Caching, lazy loading |
| Mobile Size | <50MB | Code splitting, compression |
| Database | <100k docs | Indexing, TTL cleanup |

---

## 🛠️ Tech Stack at a Glance

```
Frontend:  React Native 0.71+ / Expo
Backend:   Node.js 16+ / Express 4.18+
Database:  MongoDB 6.0+ (Atlas)
Auth:      JWT + bcryptjs
Hosting:   Heroku/Railway (backend)
           Expo (mobile)
```

---

## 📚 Document Reading Order

1. **Start with:** DAY_1_SUMMARY.md (overview of what's done)
2. **Then read:** EXECUTION_PLAN.md (understand the 7-day plan)
3. **Deep dive:** ARCHITECTURE.md (system design)
4. **Reference:** DATABASE_SCHEMA.md (data structure)
5. **API coding:** API_SPECIFICATION.md (every endpoint)
6. **UI design:** DESIGN_SYSTEM.md (components & wireframes)
7. **Setup:** DEVELOPMENT_SETUP.md (local environment)

---

## ⏰ Days 2-3 Preparation

### What to Build (Node.js Backend)

**Day 2 Objectives:**
- [ ] Express server + middleware
- [ ] JWT authentication (signup, signin, refresh)
- [ ] User model & password hashing
- [ ] Database connection
- [ ] Error handling middleware
- [ ] Rate limiting

**Day 3 Objectives:**
- [ ] Goals CRUD + business logic
- [ ] Milestones CRUD
- [ ] Habits CRUD
- [ ] Habit logging endpoints
- [ ] Analytics calculation
- [ ] Notification preferences

### What You'll Need
- Express.js knowledge (or I'll provide all code)
- Basic understanding of REST APIs
- MongoDB/Mongoose basics (or I'll explain)
- JWT concept (covered in ARCHITECTURE.md)

---

## 🚦 Status Summary

```
PLANNING:        ✅ COMPLETE
ARCHITECTURE:    ✅ COMPLETE
DATABASE:        ✅ COMPLETE
API DESIGN:      ✅ COMPLETE
UI DESIGN:       ✅ COMPLETE
ENVIRONMENT:     ✅ READY

BACKEND CODE:    ⏳ NEXT (Days 2-3)
MOBILE CODE:     ⏳ NEXT (Days 4-5)
TESTING:         ⏳ NEXT (Days 6-7)
SUBMISSION:      ⏳ NEXT (Day 7)
```

---

## 🎯 Success Looks Like (Day 7)

```
iOS Build:
  ✅ Uploaded to TestFlight
  ✅ All features working
  ✅ <2s load times
  ✅ No crashes

Android Build:
  ✅ Uploaded to Google Play internal testing
  ✅ All features working
  ✅ <2s load times
  ✅ No crashes

Backend:
  ✅ All endpoints tested
  ✅ Database queries optimized
  ✅ Ready for production deployment

Documentation:
  ✅ Setup guide complete
  ✅ Deployment ready
  ✅ Code commented
```

---

## 🤝 Next Steps

**You need to:**
1. Read through all 7 documents (2-3 hours)
2. Run DEVELOPMENT_SETUP.md steps (30 mins)
3. Verify backend & mobile start without errors

**I'll provide (when you're ready):**
1. Complete backend codebase (Day 2-3)
2. Complete mobile codebase (Day 4-5)
3. Testing & deployment guides (Day 6-7)

---

## 💡 Pro Tips

- **Read code examples** in API_SPECIFICATION.md to understand endpoint structure
- **Keep DESIGN_SYSTEM.md handy** when building UI screens
- **Reference DATABASE_SCHEMA.md** when writing API endpoints
- **Use Postman/Insomnia** to test API endpoints as you build them
- **Commit frequently** to Git (daily at minimum)
- **Test on real device** before final submission

---

## ❓ Common Questions

**Q: Can I use a different database?**  
A: Yes, but MongoDB is already schema-designed. Switching adds complexity.

**Q: Can I modify the API structure?**  
A: Yes, but it's locked in for 7-day timeline. Changes = delayed delivery.

**Q: How do I handle offline mode?**  
A: Mobile has AsyncStorage for offline caching (design ready in ARCHITECTURE.md).

**Q: When do I set up push notifications?**  
A: Designed in ARCHITECTURE.md, implementation in Day 5-6 if time permits.

**Q: Can I skip some features?**  
A: Prioritization in EXECUTION_PLAN.md. Core 8 features are non-negotiable.

---

**Everything is ready. The blueprint is complete. Now we build. 🚀**

Questions? Ask them now before we start Day 2 coding.
