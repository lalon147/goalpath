# GoalPath Design System

## 1. Color Palette

### Primary Colors
```
Primary Blue: #3B82F6
  - Used for CTAs, active states, navigation highlights
  - Light shade: #DBEAFE
  - Dark shade: #1E40AF

Accent Green: #10B981
  - Used for success states, completion badges, positive feedback
  - Light shade: #D1FAE5
  - Dark shade: #065F46
```

### Secondary Colors
```
Warning Orange: #F97316
  - Used for reminders, alerts
  - Light shade: #FFEDD5

Danger Red: #EF4444
  - Used for critical actions, abandonment
  - Light shade: #FEE2E2

Secondary Gray: #6B7280
  - Used for disabled states, secondary text
```

### Neutral Colors
```
Background: #FFFFFF (light) / #1F2937 (dark)
Surface: #F9FAFB (light) / #111827 (dark)
Text Primary: #1F2937 (light) / #F9FAFB (dark)
Text Secondary: #6B7280 (light) / #D1D5DB (dark)
Border: #E5E7EB (light) / #374151 (dark)
```

### Category Colors
```
Learning: #8B5CF6 (Purple)
Health: #EF4444 (Red)
Career: #3B82F6 (Blue)
Personal: #EC4899 (Pink)
Financial: #F59E0B (Amber)
```

---

## 2. Typography

### Font Family
- **Primary:** Inter (system sans-serif fallback)
- **Monospace:** Courier New (for data displays)

### Font Sizes & Weights
```
Display 1:   32px / Bold      (Page titles)
Display 2:   28px / Bold      (Section headers)
Heading 1:   24px / Semibold  (Screen titles)
Heading 2:   20px / Semibold  (Card titles)
Heading 3:   18px / Semibold  (Subsection titles)
Body Large:  16px / Regular   (Main text)
Body:        14px / Regular   (Secondary text)
Caption:     12px / Regular   (Helper text, labels)
Overline:    11px / Semibold  (Tags, badges)
```

### Line Heights
```
Display:  1.2
Heading:  1.3
Body:     1.5
```

---

## 3. Spacing System

**Base Unit:** 4px

```
XS: 4px   (spacing-1)
SM: 8px   (spacing-2)
MD: 12px  (spacing-3)
LG: 16px  (spacing-4)
XL: 24px  (spacing-6)
2XL: 32px (spacing-8)
3XL: 48px (spacing-12)
```

---

## 4. Component Library

### Buttons

#### Primary Button
```
Size: 48px height
Padding: 12px 24px
Background: #3B82F6
Text Color: White
Border Radius: 8px
Font Weight: Semibold
States:
  - Default
  - Hover (opacity 0.9)
  - Active (scale 0.98)
  - Disabled (opacity 0.5, cursor not-allowed)
```

#### Secondary Button
```
Background: #F3F4F6
Text Color: #1F2937
Border: 1px #E5E7EB
Same sizing as primary
```

#### Icon Button
```
Size: 44px
Content: Centered 24px icon
Background: Transparent (default) or #F3F4F6 (hover)
Border Radius: 8px
```

### Input Fields

#### Text Input
```
Height: 48px
Padding: 12px 16px
Border: 1px #E5E7EB
Border Radius: 8px
Font Size: 16px
States:
  - Default
  - Focus (border color #3B82F6, shadow)
  - Filled
  - Error (border color #EF4444)
  - Disabled (background #F9FAFB)
```

#### Text Area
```
Padding: 12px 16px
Border: 1px #E5E7EB
Min height: 120px
Border Radius: 8px
Resize: Vertical only
```

#### Date/Time Picker
```
Native mobile pickers
Custom fallback UI for web
```

### Cards

```
Background: #FFFFFF (light) / #1F2937 (dark)
Border Radius: 12px
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Padding: 16px
Margin Bottom: 12px
```

### Badges

```
Padding: 4px 8px
Border Radius: 6px
Font Size: 12px
Font Weight: Semibold
Colors: Category colors

Examples:
- Status badge (active: green, paused: gray, completed: blue)
- Priority badge (high: red, medium: orange, low: gray)
- Frequency badge (daily, weekly, monthly)
```

### Progress Indicators

#### Linear Progress Bar
```
Height: 8px
Border Radius: 4px
Background: #E5E7EB
Fill: #10B981 (dynamic)
```

#### Circular Progress
```
Size: 100px
Stroke Width: 8px
Background Circle: #E5E7EB
Fill Circle: #10B981
Center Text: Percentage
```

#### Streak Counter
```
Background: #FFFBEB (light yellow)
Border Radius: 8px
Padding: 8px 12px
Icon: 🔥
Text: "5 day streak"
```

### Navigation

#### Bottom Tab Navigation
```
5 tabs (Home, Goals, Habits, Analytics, Profile)
Active tab: Text + Icon in primary blue
Inactive tab: Icon in gray
Height: 64px (with safe area)
Icon size: 24px
Label: 12px
```

#### Modal/Sheet
```
Bottom sheet animations
Background: #FFFFFF (light) / #1F2937 (dark)
Border Radius: 16px (top only)
Shadow: 0 -2px 8px rgba(0,0,0,0.1)
```

### Alerts & Notifications

#### Toast Notification
```
Position: Bottom of screen
Duration: 3-5 seconds
Types:
  - Success (green background)
  - Error (red background)
  - Info (blue background)
  - Warning (orange background)
```

#### Banner
```
Height: 44px
Padding: 12px 16px
Icon + Text
Close button
```

---

## 5. Screen Layout Templates

### Template 1: Tab Navigation Stack
```
┌─────────────────────────────┐
│    [Header/Title]           │
├─────────────────────────────┤
│                             │
│      [Content Area]         │
│                             │
├─────────────────────────────┤
│ 🏠    🎯    🔄   📊    👤  │  ← Bottom Nav (5 tabs)
└─────────────────────────────┘
```

### Template 2: Header with Scroll Content
```
┌─────────────────────────────┐
│ ◄  [Title]         [Menu]   │
├─────────────────────────────┤
│                             │
│      [Scrollable Content]   │
│         (Cards, Lists)      │
│                             │
└─────────────────────────────┘
```

### Template 3: Modal Sheet
```
                              ┌─────────────────────────┐
                              │  ▬▬▬  [Title]      ×   │
                              ├─────────────────────────┤
                              │                         │
                              │  [Modal Content]        │
                              │                         │
                              ├─────────────────────────┤
                              │ [Cancel]  [Confirm]    │
                              └─────────────────────────┘
```

---

## 6. Screen Wireframes

### AUTH FLOW

#### Screen 1: Welcome/Sign In
```
┌─────────────────────────────┐
│                             │
│       GoalPath Logo         │
│                             │
│    "Set & Achieve Goals"    │
│                             │
├─────────────────────────────┤
│                             │
│  📧 Email                   │
│  [_______________________]  │
│                             │
│  🔐 Password                │
│  [_______________________]  │
│                             │
│  [  Sign In (Blue)  ]       │
│                             │
│  New user? Sign up →        │
│                             │
└─────────────────────────────┘
```

#### Screen 2: Sign Up
```
┌─────────────────────────────┐
│  ◄  Sign Up                 │
├─────────────────────────────┤
│                             │
│  First Name                 │
│  [_______________________]  │
│                             │
│  Last Name                  │
│  [_______________________]  │
│                             │
│  Email                      │
│  [_______________________]  │
│                             │
│  Password                   │
│  [_______________________]  │
│                             │
│  [   Create Account    ]    │
│                             │
│  Have account? Sign in →    │
│                             │
└─────────────────────────────┘
```

#### Screen 3: Onboarding
```
┌─────────────────────────────┐
│              1 of 3         │
├─────────────────────────────┤
│                             │
│       🎯 Set Goals          │
│                             │
│   "Define what matters      │
│    most to you"             │
│                             │
│                             │
│                             │
│    [Next]  (skip at end)   │
│                             │
└─────────────────────────────┘
```

---

### HOME/DASHBOARD FLOW

#### Screen 4: Dashboard (Home Tab)
```
┌─────────────────────────────┐
│ ◄         Home          ⚙️   │
├─────────────────────────────┤
│                             │
│  Welcome, John! 👋          │
│                             │
│  ┌───────────────────────┐  │
│  │ 📊 Your Progress      │  │
│  │ 4/5 Goals Active      │  │
│  │ 87% Habit Completion  │  │
│  └───────────────────────┘  │
│                             │
│  🔥 Streaks                 │
│  ┌───────────────────────┐  │
│  │ • Run (5 days) 🏃     │  │
│  │ • Study (14 days) 📚  │  │
│  │ • Meditate (3 days)🧘│  │
│  └───────────────────────┘  │
│                             │
│  📌 Due Soon                │
│  ┌───────────────────────┐  │
│  │ Spanish A1 Level      │  │
│  │ Due: Feb 28 (8 days)  │  │
│  │ [▓▓▓░░░░░░] 30%      │  │
│  └───────────────────────┘  │
│                             │
│ 🏠    🎯    🔄   📊    👤  │
└─────────────────────────────┘
```

---

### GOALS FLOW

#### Screen 5: Goals List (Goals Tab)
```
┌─────────────────────────────┐
│         Goals           +    │
├─────────────────────────────┤
│ [Active] [Completed] [All]  │
├─────────────────────────────┤
│                             │
│  🎓 Learn Spanish           │
│  ┌───────────────────────┐  │
│  │ Due: Dec 31 (10mo)    │  │
│  │ [▓▓▓░░░░░░░] 25%     │  │
│  │ 4/4 Habits Active    │  │
│  │ Priority: High       │  │
│  └───────────────────────┘  │
│                             │
│  🏃 Run a Marathon          │
│  ┌───────────────────────┐  │
│  │ Due: Oct 31 (9mo)     │  │
│  │ [▓░░░░░░░░░] 10%     │  │
│  │ 2/4 Habits Active    │  │
│  │ Priority: High       │  │
│  └───────────────────────┘  │
│                             │
│ 🏠    🎯    🔄   📊    👤  │
└─────────────────────────────┘
```

#### Screen 6: Goal Detail
```
┌─────────────────────────────┐
│ ◄  Learn Spanish      ⋮      │
├─────────────────────────────┤
│                             │
│  Category: Learning  🎓     │
│  Priority: High  (red)      │
│  Status: Active             │
│                             │
│  Progress: 25%              │
│  [▓▓▓░░░░░░░░░░░░]         │
│  Due: Dec 31, 2024          │
│                             │
│  📍 Milestones              │
│  ✅ Reach A1 Level (done)   │
│  ⏳ Reach A2 Level (pending)│
│  ○ Reach B1 Level          │
│  ○ Reach B2 Level          │
│                             │
│  🔄 Habits (4)              │
│  • Study 30min/day (14 day) │
│  • Take lessons (weekly)    │
│  • Speak practice (3x/wk)   │
│  • Read Spanish (daily)     │
│                             │
│ [Edit]  [Delete]  [Share]  │
│                             │
└─────────────────────────────┘
```

#### Screen 7: Create/Edit Goal
```
┌─────────────────────────────┐
│ ◄  New Goal            ✓    │
├─────────────────────────────┤
│                             │
│  Title *                    │
│  [_______________________]  │
│                             │
│  Description                │
│  [_______________________]  │
│                             │
│  Category *                 │
│  [Learning ▼]               │
│                             │
│  Target Date *              │
│  [📅 Dec 31, 2024  ]        │
│                             │
│  Priority                   │
│  ⚪ Low  ◉ High            │
│                             │
│  Color Picker               │
│  🎨 [Purple] [Blue] [Red]   │
│                             │
│  [  Save Goal  ]            │
│                             │
└─────────────────────────────┘
```

---

### HABITS FLOW

#### Screen 8: Habits List (Habits Tab)
```
┌─────────────────────────────┐
│      Habits             +    │
├─────────────────────────────┤
│ [Today] [Active] [Archive]  │
├─────────────────────────────┤
│                             │
│  🔥 Study Spanish (Today)   │
│  ┌───────────────────────┐  │
│  │ 📌 Daily              │  │
│  │ 🔥 14 day streak      │  │
│  │ [✓ Log]  [Details]   │  │
│  └───────────────────────┘  │
│                             │
│  🔥 Morning Run (Today)     │
│  ┌───────────────────────┐  │
│  │ 📌 3x per week        │  │
│  │ 🔥 5 day streak       │  │
│  │ [✓ Log]  [Details]   │  │
│  └───────────────────────┘  │
│                             │
│  Meditation (Today)         │
│  ┌───────────────────────┐  │
│  │ 📌 Daily              │  │
│  │ 🔥 3 day streak       │  │
│  │ [✓ Log]  [Details]   │  │
│  └───────────────────────┘  │
│                             │
│ 🏠    🎯    🔄   📊    👤  │
└─────────────────────────────┘
```

#### Screen 9: Habit Detail & Logging
```
┌─────────────────────────────┐
│ ◄  Study Spanish      ⋮      │
├─────────────────────────────┤
│                             │
│  Frequency: Daily           │
│  Linked Goal: Learn Spanish │
│  Status: Active             │
│                             │
│  🔥 Streaks                 │
│  Current: 14 days           │
│  Longest: 45 days           │
│  Total: 78 completions      │
│                             │
│  📅 This Month              │
│  Completion: 87%            │
│  ✓ 20 days  ✕ 2 days      │
│                             │
│  ⏰ Reminders               │
│  🔔 7:00 PM - "Study time!" │
│                             │
│  📋 Recent Logs             │
│  Jan 20: ✓ 35 min (High)   │
│  Jan 19: ✓ 30 min (Med)    │
│  Jan 18: ✓ 40 min (High)   │
│                             │
│ [Log Today]  [Edit]         │
│                             │
└─────────────────────────────┘
```

#### Screen 10: Log Habit Modal
```
                              ┌─────────────────────────┐
                              │ ▬▬▬  Log Habit    ×    │
                              ├─────────────────────────┤
                              │ Study Spanish (Daily)   │
                              │                         │
                              │ Date                    │
                              │ [📅 Jan 20, 2024]      │
                              │                         │
                              │ Status *                │
                              │ ◉ Completed  ○ Skipped │
                              │                         │
                              │ Duration (minutes)      │
                              │ [_________________]     │
                              │                         │
                              │ Intensity               │
                              │ ○ Low ◉ Med ○ High    │
                              │                         │
                              │ Notes                   │
                              │ [_________________]     │
                              │                         │
                              │ [Cancel]  [Save Log]   │
                              └─────────────────────────┘
```

---

### ANALYTICS FLOW

#### Screen 11: Analytics (Analytics Tab)
```
┌─────────────────────────────┐
│      Analytics          📊   │
├─────────────────────────────┤
│ [Week] [Month] [All Time]   │
├─────────────────────────────┤
│                             │
│  📊 Overview                │
│  ┌───────────────────────┐  │
│  │ 4 Goals Active        │  │
│  │ 8 Habits Active       │  │
│  │ 87% Completion Rate   │  │
│  │ 5 Streaks (7+ days)   │  │
│  └───────────────────────┘  │
│                             │
│  🎯 Goals Progress          │
│  ┌───────────────────────┐  │
│  │ [📈 Line Chart]       │  │
│  │ % complete over time  │  │
│  └───────────────────────┘  │
│                             │
│  🔄 Habit Completion        │
│  ┌───────────────────────┐  │
│  │ [🍰 Pie Chart]        │  │
│  │ 87% Complete, 13%     │  │
│  │ Skipped               │  │
│  └───────────────────────┘  │
│                             │
│  🏠    🎯    🔄   📊    👤  │
└─────────────────────────────┘
```

---

### PROFILE FLOW

#### Screen 12: Profile (Profile Tab)
```
┌─────────────────────────────┐
│      Profile           ⚙️    │
├─────────────────────────────┤
│                             │
│       👤 Profile Pic        │
│       John Doe              │
│  john.doe@example.com       │
│                             │
│  ┌───────────────────────┐  │
│  │ 🎯  4 Active Goals    │  │
│  │ 🔄  7 Active Habits   │  │
│  │ 📈  45 Milestones     │  │
│  └───────────────────────┘  │
│                             │
│  Settings                   │
│  ► Edit Profile             │
│  ► Notifications            │
│  ► Privacy & Security       │
│  ► About                    │
│                             │
│  Account                    │
│  ► Change Password          │
│  ► Email Preferences        │
│  ► Export Data              │
│  ► Log Out                  │
│                             │
│ 🏠    🎯    🔄   📊    👤  │
└─────────────────────────────┘
```

---

## 7. Animation & Interaction Specs

### Transitions
```
- Screen navigation: Slide from right (push), slide to left (pop)
- Modal open: Fade in + slide up
- Modal close: Fade out + slide down
- Card expand: Smooth height expansion
- Button press: Scale 0.98
```

### Durations
```
- Quick interactions: 200ms
- Page transitions: 300ms
- Modal animations: 250ms
- Progress updates: 500ms
```

### Feedback
```
- Button tap: Visual feedback (scale + opacity change)
- Successful action: Green toast + subtle bounce
- Error: Red banner + shake animation
- Loading: Spinner or skeleton screen
```

---

## 8. Accessibility

### Contrast Ratios
- Text on background: 4.5:1 minimum
- All buttons meet WCAG AA standards

### Touch Targets
- Minimum 48x48px for all interactive elements
- Spacing: 12px minimum between touch targets

### Text
- Font size minimum: 14px for body text
- Clear labels for form inputs
- Alt text for all icons

### Navigation
- Keyboard navigation support
- Screen reader support for all content
- High contrast mode support

---

## 9. Responsive Design

### Breakpoints
```
Mobile: 375px - 576px
Tablet: 577px - 992px
Desktop: 993px+
```

### Current Focus: Mobile First
- Designed for 375px minimum width
- Touch-optimized interactions
- Bottom navigation for easy thumb reach

---

## 10. Dark Mode

All colors have dark mode variants:
```
Light Mode:
  Background: #FFFFFF
  Text: #1F2937
  Border: #E5E7EB

Dark Mode:
  Background: #1F2937
  Text: #F9FAFB
  Border: #374151
```

Status: Will implement toggle in Phase 2 if time permits.
