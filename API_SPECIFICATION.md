# GoalPath API Specification

## Base URL
```
Production: https://goalpath-api.herokuapp.com/api
Development: http://localhost:3000/api
```

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

# 1. AUTHENTICATION ENDPOINTS

## 1.1 User Sign Up
**POST** `/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}
```

**Status Codes:** 201, 400, 409

---

## 1.2 User Sign In
**POST** `/auth/signin`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Status Codes:** 200, 400, 401

---

## 1.3 Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Status Codes:** 200, 401

---

## 1.4 Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Status Codes:** 200, 401

---

# 2. USER ENDPOINTS

## 2.1 Get User Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "https://...",
    "bio": "Personal growth enthusiast",
    "timezone": "UTC-5",
    "preferences": {
      "notificationsEnabled": true,
      "emailNotifications": true,
      "pushNotificationsEnabled": true,
      "dailyReminderTime": "09:00",
      "language": "en"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Status Codes:** 200, 401

---

## 2.2 Update User Profile
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "timezone": "UTC-4",
  "preferences": {
    "notificationsEnabled": true,
    "emailNotifications": false,
    "dailyReminderTime": "10:00"
  }
}
```

**Response (200 OK):** Same as Get User Profile

**Status Codes:** 200, 400, 401

---

## 2.3 Change Password
**POST** `/users/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Status Codes:** 200, 400, 401

---

# 3. GOALS ENDPOINTS

## 3.1 Create Goal
**POST** `/goals`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Learn Spanish",
  "description": "Achieve B2 level fluency",
  "category": "learning",
  "type": "long-term",
  "targetDate": "2024-12-31T23:59:59Z",
  "priority": "high",
  "color": "#FF6B6B",
  "emoji": "🎯"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Learn Spanish",
    "description": "Achieve B2 level fluency",
    "category": "learning",
    "type": "long-term",
    "targetDate": "2024-12-31T23:59:59Z",
    "priority": "high",
    "status": "active",
    "completionPercentage": 0,
    "totalMilestones": 0,
    "completedMilestones": 0,
    "color": "#FF6B6B",
    "emoji": "🎯",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:** 201, 400, 401

---

## 3.2 Get All Goals
**GET** `/goals?status=active&sortBy=createdAt&order=desc&limit=20&page=1`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: "active", "completed", "paused", "abandoned" (optional)
- `category`: filter by category (optional)
- `sortBy`: "createdAt", "targetDate", "priority" (default: createdAt)
- `order`: "asc", "desc" (default: desc)
- `limit`: items per page (default: 20)
- `page`: page number (default: 1)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "507f1f77bcf86cd799439012",
        "title": "Learn Spanish",
        "description": "Achieve B2 level fluency",
        "category": "learning",
        "type": "long-term",
        "status": "active",
        "completionPercentage": 25,
        "totalMilestones": 4,
        "completedMilestones": 1,
        "targetDate": "2024-12-31T23:59:59Z",
        "priority": "high",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

**Status Codes:** 200, 401

---

## 3.3 Get Goal Details
**GET** `/goals/{goalId}`

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `goalId`: MongoDB ObjectId

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Learn Spanish",
    "description": "Achieve B2 level fluency",
    "category": "learning",
    "type": "long-term",
    "status": "active",
    "completionPercentage": 25,
    "totalMilestones": 4,
    "completedMilestones": 1,
    "targetDate": "2024-12-31T23:59:59Z",
    "priority": "high",
    "color": "#FF6B6B",
    "emoji": "🎯",
    "milestones": [
      {
        "id": "507f1f77bcf86cd799439020",
        "title": "Reach A1 Level",
        "status": "completed",
        "completedDate": "2024-02-15T10:30:00Z",
        "targetDate": "2024-02-28T23:59:59Z"
      }
    ],
    "habits": [
      {
        "id": "507f1f77bcf86cd799439030",
        "title": "Study Spanish 30 mins/day",
        "frequency": "daily",
        "currentStreak": 14,
        "status": "active"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Status Codes:** 200, 401, 404

---

## 3.4 Update Goal
**PUT** `/goals/{goalId}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (same fields as Create Goal, all optional)
```json
{
  "title": "Learn Spanish Fluently",
  "priority": "medium",
  "status": "paused"
}
```

**Response (200 OK):** Same as Get Goal Details

**Status Codes:** 200, 400, 401, 404

---

## 3.5 Delete Goal
**DELETE** `/goals/{goalId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

**Status Codes:** 200, 401, 404

---

# 4. MILESTONES ENDPOINTS

## 4.1 Create Milestone
**POST** `/goals/{goalId}/milestones`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Reach A1 Level",
  "description": "Achieve basic conversational Spanish",
  "targetDate": "2024-02-28T23:59:59Z",
  "reward": "Celebrate with Spanish dinner"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "goalId": "507f1f77bcf86cd799439012",
    "title": "Reach A1 Level",
    "description": "Achieve basic conversational Spanish",
    "status": "pending",
    "targetDate": "2024-02-28T23:59:59Z",
    "reward": "Celebrate with Spanish dinner",
    "order": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:** 201, 400, 401

---

## 4.2 Get Milestones
**GET** `/goals/{goalId}/milestones?status=pending`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: "pending", "in-progress", "completed" (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439020",
      "title": "Reach A1 Level",
      "status": "pending",
      "targetDate": "2024-02-28T23:59:59Z",
      "order": 1
    }
  ]
}
```

**Status Codes:** 200, 401, 404

---

## 4.3 Update Milestone
**PUT** `/goals/{goalId}/milestones/{milestoneId}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "in-progress"
}
```

**Response (200 OK):** Same as Create Milestone

**Status Codes:** 200, 400, 401, 404

---

## 4.4 Complete Milestone
**POST** `/goals/{goalId}/milestones/{milestoneId}/complete`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "status": "completed",
    "completedDate": "2024-02-15T10:30:00Z"
  }
}
```

**Status Codes:** 200, 401, 404

---

## 4.5 Delete Milestone
**DELETE** `/goals/{goalId}/milestones/{milestoneId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Milestone deleted successfully"
}
```

**Status Codes:** 200, 401, 404

---

# 5. HABITS ENDPOINTS

## 5.1 Create Habit
**POST** `/habits`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "goalId": "507f1f77bcf86cd799439012",
  "title": "Study Spanish 30 mins",
  "description": "Daily language learning",
  "frequency": "daily",
  "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
  "startDate": "2024-01-15T00:00:00Z",
  "reminders": [
    {
      "time": "19:00",
      "message": "Time for Spanish practice!",
      "enabled": true
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439011",
    "goalId": "507f1f77bcf86cd799439012",
    "title": "Study Spanish 30 mins",
    "frequency": "daily",
    "status": "active",
    "currentStreak": 0,
    "longestStreak": 0,
    "totalCompletions": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:** 201, 400, 401

---

## 5.2 Get All Habits
**GET** `/habits?status=active&goalId=507f1f77bcf86cd799439012`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: "active", "paused", "completed" (optional)
- `goalId`: filter by goal (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439030",
      "title": "Study Spanish 30 mins",
      "frequency": "daily",
      "status": "active",
      "currentStreak": 5,
      "longestStreak": 12,
      "totalCompletions": 45
    }
  ]
}
```

**Status Codes:** 200, 401

---

## 5.3 Get Habit Details
**GET** `/habits/{habitId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439011",
    "goalId": "507f1f77bcf86cd799439012",
    "title": "Study Spanish 30 mins",
    "description": "Daily language learning",
    "frequency": "daily",
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
    "status": "active",
    "currentStreak": 5,
    "longestStreak": 12,
    "totalCompletions": 45,
    "reminders": [
      {
        "id": "507f1f77bcf86cd799439040",
        "time": "19:00",
        "message": "Time for Spanish practice!",
        "enabled": true
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:** 200, 401, 404

---

## 5.4 Update Habit
**PUT** `/habits/{habitId}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all optional)
```json
{
  "title": "Study Spanish 45 mins",
  "frequency": "weekly",
  "daysOfWeek": [1, 3, 5, 6],
  "status": "paused"
}
```

**Response (200 OK):** Same as Get Habit Details

**Status Codes:** 200, 400, 401, 404

---

## 5.5 Delete Habit
**DELETE** `/habits/{habitId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Habit deleted successfully"
}
```

**Status Codes:** 200, 401, 404

---

# 6. HABIT LOGGING ENDPOINTS

## 6.1 Log Habit Completion
**POST** `/habits/{habitId}/log`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "logDate": "2024-01-20T00:00:00Z",
  "status": "completed",
  "notes": "Great session today!",
  "duration": 35,
  "intensity": "high"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439050",
    "habitId": "507f1f77bcf86cd799439030",
    "logDate": "2024-01-20T00:00:00Z",
    "status": "completed",
    "notes": "Great session today!",
    "duration": 35,
    "intensity": "high",
    "loggedAt": "2024-01-20T19:15:00Z",
    "createdAt": "2024-01-20T19:15:00Z"
  }
}
```

**Status Codes:** 201, 400, 401

---

## 6.2 Get Habit Logs
**GET** `/habits/{habitId}/logs?startDate=2024-01-01&endDate=2024-01-31&limit=30&page=1`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `status`: "completed", "skipped", "failed" (optional)
- `limit`: items per page (default: 30)
- `page`: page number (default: 1)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "507f1f77bcf86cd799439050",
        "logDate": "2024-01-20T00:00:00Z",
        "status": "completed",
        "notes": "Great session!",
        "duration": 35
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 45,
      "itemsPerPage": 30
    },
    "statistics": {
      "totalLogged": 28,
      "completionRate": 0.93,
      "currentStreak": 5,
      "longestStreak": 12
    }
  }
}
```

**Status Codes:** 200, 401, 404

---

## 6.3 Update Habit Log
**PUT** `/habits/{habitId}/logs/{logId}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "completed",
  "duration": 40,
  "notes": "Updated notes"
}
```

**Response (200 OK):** Same as Log Habit Completion

**Status Codes:** 200, 400, 401, 404

---

## 6.4 Delete Habit Log
**DELETE** `/habits/{habitId}/logs/{logId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Log deleted successfully"
}
```

**Status Codes:** 200, 401, 404

---

# 7. ANALYTICS ENDPOINTS

## 7.1 Get Goal Progress
**GET** `/analytics/goals/{goalId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "goalId": "507f1f77bcf86cd799439012",
    "title": "Learn Spanish",
    "completionPercentage": 25,
    "totalMilestones": 4,
    "completedMilestones": 1,
    "status": "active",
    "daysRemaining": 320,
    "habits": [
      {
        "habitId": "507f1f77bcf86cd799439030",
        "title": "Study Spanish 30 mins",
        "completionRate": 0.87,
        "currentStreak": 5,
        "totalCompletions": 45
      }
    ],
    "milestoneProgress": [
      {
        "order": 1,
        "title": "Reach A1 Level",
        "status": "completed",
        "completedDate": "2024-02-15T10:30:00Z"
      }
    ]
  }
}
```

**Status Codes:** 200, 401, 404

---

## 7.2 Get Habit Statistics
**GET** `/analytics/habits/{habitId}?startDate=2024-01-01&endDate=2024-01-31`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate`: ISO date string (optional, default: 30 days ago)
- `endDate`: ISO date string (optional, default: today)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "habitId": "507f1f77bcf86cd799439030",
    "title": "Study Spanish 30 mins",
    "totalLogged": 28,
    "completionRate": 0.93,
    "currentStreak": 5,
    "longestStreak": 12,
    "averageDuration": 32,
    "totalDuration": 896,
    "frequencyBreakdown": {
      "completed": 28,
      "skipped": 2,
      "failed": 0
    },
    "dailyBreakdown": [
      {
        "date": "2024-01-20",
        "status": "completed",
        "duration": 35
      }
    ]
  }
}
```

**Status Codes:** 200, 401, 404

---

## 7.3 Get Dashboard Overview
**GET** `/analytics/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalGoals": 5,
      "activeGoals": 4,
      "completedGoals": 1,
      "completedMilestones": 3,
      "totalHabits": 8,
      "activeHabits": 7
    },
    "weeklyStats": {
      "habitCompletionRate": 0.87,
      "milestonesAchieved": 1,
      "streaksActive": 5
    },
    "recentActivity": [
      {
        "type": "milestone_completed",
        "goalTitle": "Learn Spanish",
        "milestoneTitle": "Reach A1 Level",
        "completedDate": "2024-02-15T10:30:00Z"
      }
    ],
    "goals": [
      {
        "id": "507f1f77bcf86cd799439012",
        "title": "Learn Spanish",
        "completionPercentage": 25,
        "status": "active"
      }
    ]
  }
}
```

**Status Codes:** 200, 401

---

# 8. NOTIFICATIONS ENDPOINTS

## 8.1 Get Notifications
**GET** `/notifications?status=unread&limit=20&page=1`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: "unread", "read" (optional)
- `limit`: items per page (default: 20)
- `page`: page number (default: 1)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439060",
        "type": "milestone_completed",
        "title": "Milestone Completed! 🎉",
        "message": "You completed 'Reach A1 Level'!",
        "relatedGoalId": "507f1f77bcf86cd799439012",
        "status": "unread",
        "sentAt": "2024-02-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 35,
      "itemsPerPage": 20
    }
  }
}
```

**Status Codes:** 200, 401

---

## 8.2 Mark Notification as Read
**PUT** `/notifications/{notificationId}/read`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439060",
    "status": "read",
    "readAt": "2024-02-16T14:22:00Z"
  }
}
```

**Status Codes:** 200, 401, 404

---

## 8.3 Delete Notification
**DELETE** `/notifications/{notificationId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

**Status Codes:** 200, 401, 404

---

# Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "Field-specific error message"
    }
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Missing or invalid auth token
- `AUTHORIZATION_ERROR` - User not permitted to access resource
- `NOT_FOUND` - Resource does not exist
- `CONFLICT` - Resource already exists
- `INTERNAL_SERVER_ERROR` - Server error

---

# Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:** 
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1642256400`

---

# API Versioning

Current version: v1
Future versions will be available at `/api/v2`, etc.
