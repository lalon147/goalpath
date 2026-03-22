# GoalPath Database Schema

## Database: MongoDB (NoSQL Document Database)

### Overview
- **Database Name:** goalpath_db
- **Strategy:** Document-based with nested arrays for related data
- **Relationships:** References (ObjectId) for cross-document relationships
- **Indexing:** Optimized for common queries

---

## Collection 1: Users

**Purpose:** Store user account information and authentication

```javascript
{
  _id: ObjectId("..."),
  
  // Basic Information
  email: "user@example.com",
  password: "$2b$12$...", // bcrypt hash
  firstName: "John",
  lastName: "Doe",
  
  // Profile
  profilePicture: "https://...",
  bio: "Personal growth enthusiast",
  timezone: "UTC-5",
  
  // Preferences
  preferences: {
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotificationsEnabled: true,
    dailyReminderTime: "09:00",
    language: "en"
  },
  
  // Account Status
  emailVerified: true,
  status: "active", // "active", "inactive", "suspended"
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-20T14:22:00Z"),
  
  // Tokens (for password reset, email verification)
  resetTokens: [
    {
      token: "abc123xyz...",
      expiresAt: ISODate("2024-01-22T10:30:00Z")
    }
  ]
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: -1 })
db.users.createIndex({ status: 1 })
```

**Sample Data:**
```javascript
{
  email: "john.doe@gmail.com",
  password: "$2b$12$...",
  firstName: "John",
  lastName: "Doe",
  profilePicture: null,
  timezone: "UTC-5",
  preferences: {
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotificationsEnabled: true,
    dailyReminderTime: "09:00",
    language: "en"
  },
  emailVerified: true,
  status: "active",
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

---

## Collection 2: Goals

**Purpose:** Store user goals with metadata and structure

```javascript
{
  _id: ObjectId("..."),
  
  // Core Information
  userId: ObjectId("..."), // Reference to Users collection
  title: "Learn Spanish",
  description: "Achieve B2 level fluency in Spanish",
  
  // Goal Structure
  category: "learning", // "learning", "health", "career", "personal", "financial"
  type: "long-term", // "short-term", "long-term"
  
  // Timeline
  startDate: ISODate("2024-01-15T00:00:00Z"),
  targetDate: ISODate("2024-12-31T23:59:59Z"),
  
  // Progress Tracking
  status: "active", // "active", "completed", "paused", "abandoned"
  priority: "high", // "low", "medium", "high"
  
  // Metrics
  completionPercentage: 0, // Calculated from milestones
  totalMilestones: 5,
  completedMilestones: 0,
  
  // Visual & Motivational
  color: "#FF6B6B", // For UI display
  emoji: "🎯",
  
  // Relationships
  milestones: [ObjectId("..."), ObjectId("...")], // Array of milestone IDs
  habits: [ObjectId("..."), ObjectId("...")], // Array of habit IDs
  
  // Metadata
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-20T14:22:00Z")
}
```

**Indexes:**
```javascript
db.goals.createIndex({ userId: 1, status: 1 })
db.goals.createIndex({ userId: 1, createdAt: -1 })
db.goals.createIndex({ userId: 1, targetDate: 1 })
db.goals.createIndex({ status: 1 })
```

**Sample Data:**
```javascript
{
  userId: ObjectId("..."),
  title: "Run a Marathon",
  description: "Complete a full 42.2km marathon",
  category: "health",
  type: "long-term",
  startDate: ISODate("2024-01-15T00:00:00Z"),
  targetDate: ISODate("2024-10-31T23:59:59Z"),
  status: "active",
  priority: "high",
  completionPercentage: 25,
  totalMilestones: 4,
  completedMilestones: 1,
  color: "#FF6B6B",
  emoji: "🏃",
  milestones: [ObjectId("..."), ObjectId("...")],
  habits: [ObjectId("...")],
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

---

## Collection 3: Milestones

**Purpose:** Track major checkpoints within a goal

```javascript
{
  _id: ObjectId("..."),
  
  // Core Information
  goalId: ObjectId("..."), // Reference to Goals collection
  title: "Reach 10km running distance",
  description: "Be able to run 10km without stopping",
  
  // Milestone Structure
  order: 1, // Sequence within goal
  targetDate: ISODate("2024-03-31T23:59:59Z"),
  
  // Status
  status: "pending", // "pending", "in-progress", "completed"
  completedDate: null, // Populated when milestone is completed
  
  // Reward/Recognition
  reward: "Celebrate with friends",
  
  // Metadata
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  completedAt: null
}
```

**Indexes:**
```javascript
db.milestones.createIndex({ goalId: 1, order: 1 })
db.milestones.createIndex({ status: 1 })
db.milestones.createIndex({ targetDate: 1 })
```

**Sample Data:**
```javascript
{
  goalId: ObjectId("..."),
  title: "Complete 5K run",
  description: "Run 5km without walking",
  order: 1,
  targetDate: ISODate("2024-02-28T23:59:59Z"),
  status: "completed",
  completedDate: ISODate("2024-02-15T10:30:00Z"),
  reward: "Treat yourself to new running shoes",
  createdAt: ISODate(),
  completedAt: ISODate()
}
```

---

## Collection 4: Habits

**Purpose:** Daily/weekly recurring habits linked to goals

```javascript
{
  _id: ObjectId("..."),
  
  // Core Information
  userId: ObjectId("..."), // Reference to Users collection
  goalId: ObjectId("..."), // Reference to Goals collection
  
  title: "Run 3 times per week",
  description: "Morning runs to build endurance",
  
  // Habit Frequency
  frequency: "weekly", // "daily", "weekly", "monthly"
  daysOfWeek: [1, 3, 5], // 0=Sunday, 1=Monday... (for weekly habits)
  
  // Tracking
  currentStreak: 7, // Consecutive days/weeks completed
  longestStreak: 12,
  totalCompletions: 45,
  
  // Status
  status: "active", // "active", "paused", "completed"
  startDate: ISODate("2024-01-15T00:00:00Z"),
  
  // Reminders
  reminders: [
    {
      id: ObjectId("..."),
      time: "06:00", // 24-hour format
      message: "Time for your morning run!",
      enabled: true
    }
  ],
  
  // Metadata
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-20T14:22:00Z")
}
```

**Indexes:**
```javascript
db.habits.createIndex({ userId: 1, status: 1 })
db.habits.createIndex({ userId: 1, goalId: 1 })
db.habits.createIndex({ status: 1 })
```

**Sample Data:**
```javascript
{
  userId: ObjectId("..."),
  goalId: ObjectId("..."),
  title: "Study Spanish for 30 minutes",
  description: "Daily language learning",
  frequency: "daily",
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  currentStreak: 14,
  longestStreak: 45,
  totalCompletions: 78,
  status: "active",
  startDate: ISODate("2024-01-01T00:00:00Z"),
  reminders: [
    {
      time: "19:00",
      message: "Time for Spanish practice!",
      enabled: true
    }
  ],
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

---

## Collection 5: HabitLogs (Tracking Records)

**Purpose:** Daily/weekly records of habit completions

```javascript
{
  _id: ObjectId("..."),
  
  // Reference
  habitId: ObjectId("..."), // Reference to Habits collection
  userId: ObjectId("..."),
  
  // Logging
  logDate: ISODate("2024-01-20T00:00:00Z"), // The date of the habit
  status: "completed", // "completed", "skipped", "failed"
  
  // Notes & Metadata
  notes: "Great session, felt very motivated!",
  duration: 35, // minutes
  intensity: "high", // "low", "medium", "high" (optional)
  
  // Timestamps
  loggedAt: ISODate("2024-01-20T19:15:00Z"), // When user logged it
  createdAt: ISODate("2024-01-20T19:15:00Z")
}
```

**Indexes:**
```javascript
db.habitlogs.createIndex({ habitId: 1, logDate: -1 })
db.habitlogs.createIndex({ userId: 1, logDate: -1 })
db.habitlogs.createIndex({ logDate: 1 })
```

**Sample Data:**
```javascript
{
  habitId: ObjectId("..."),
  userId: ObjectId("..."),
  logDate: ISODate("2024-01-20T00:00:00Z"),
  status: "completed",
  notes: "Ran 5km in 25 minutes",
  duration: 25,
  intensity: "high",
  loggedAt: ISODate("2024-01-20T07:30:00Z"),
  createdAt: ISODate()
}
```

---

## Collection 6: Notifications

**Purpose:** Store notification history and templates

```javascript
{
  _id: ObjectId("..."),
  
  // Recipient
  userId: ObjectId("..."),
  
  // Notification Content
  type: "milestone_completed", // "streak_achieved", "milestone_completed", "habit_reminder", "motivational"
  title: "Milestone Completed! 🎉",
  message: "You completed your first milestone!",
  
  // Related Objects
  relatedGoalId: ObjectId("..."),
  relatedHabitId: ObjectId("..."),
  relatedMilestoneId: ObjectId("..."),
  
  // Status
  status: "unread", // "unread", "read"
  readAt: null,
  
  // Delivery
  channel: "push", // "push", "email", "in-app"
  sentAt: ISODate("2024-01-20T19:30:00Z"),
  
  // Metadata
  createdAt: ISODate("2024-01-20T19:30:00Z")
}
```

**Indexes:**
```javascript
db.notifications.createIndex({ userId: 1, createdAt: -1 })
db.notifications.createIndex({ userId: 1, status: 1 })
```

---

## Data Relationships Summary

```
Users (1) ──── (Many) Goals
Users (1) ──── (Many) Habits
Users (1) ──── (Many) HabitLogs
Users (1) ──── (Many) Notifications

Goals (1) ──── (Many) Milestones
Goals (1) ──── (Many) Habits

Habits (1) ──── (Many) HabitLogs
```

---

## Database Initialization Script

```javascript
// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password"],
      properties: {
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" }
      }
    }
  }
});

// Repeat for other collections...

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.goals.createIndex({ userId: 1, status: 1 });
db.habits.createIndex({ userId: 1, status: 1 });
db.habitlogs.createIndex({ habitId: 1, logDate: -1 });
db.notifications.createIndex({ userId: 1, createdAt: -1 });
```

---

## Query Examples (Common Operations)

### Get all active goals for a user
```javascript
db.goals.find({
  userId: ObjectId("..."),
  status: "active"
}).sort({ createdAt: -1 })
```

### Get habit logs for past 30 days
```javascript
db.habitlogs.find({
  habitId: ObjectId("..."),
  logDate: {
    $gte: ISODate("2024-12-21T00:00:00Z"),
    $lte: ISODate("2024-01-20T23:59:59Z")
  }
}).sort({ logDate: -1 })
```

### Calculate goal progress
```javascript
db.goals.aggregate([
  { $match: { _id: ObjectId("...") } },
  { $lookup: {
      from: "milestones",
      localField: "_id",
      foreignField: "goalId",
      as: "allMilestones"
    }
  },
  { $addFields: {
      completionPercentage: {
        $divide: [
          { $size: { $filter: { input: "$allMilestones", as: "m", cond: { $eq: ["$$m.status", "completed"] } } } },
          { $size: "$allMilestones" }
        ]
      }
    }
  }
])
```

---

## Performance Considerations

1. **Data Denormalization:** Goals keep `completionPercentage` (denormalized) for faster reads
2. **Pagination:** HabitLogs queries should paginate (20 items per page)
3. **TTL Indexes:** Reset tokens auto-delete after expiration
4. **Archiving:** Old completed goals can be archived to separate collection

---

## Scalability Roadmap

- **Current:** Single MongoDB instance (suitable for <100k users)
- **Future:** Database sharding by userId for horizontal scaling
- **Caching:** Redis cache for frequently accessed goals/habits
