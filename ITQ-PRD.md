# PRD — Itqan Platform (Islamic Sciences Academy)

A comprehensive Islamic educational platform built with **Next.js 16 + Supabase + PostgreSQL** that combines live lessons, interactive courses, and an advanced memorization and review system. The platform supports two modes: **Digital Library (Reader)** and **Academy** with seamless switching between them.

**Last Updated:** June 21, 2026

---

## 1. Project Overview

### 1.1 Vision
A comprehensive educational platform for an Islamic Sciences Academy that provides an integrated learning environment including courses, Quran memorization & review, competitions, Islamic jurisprudence (Fiqh), forum, and live sessions — with an advanced gamification system (points, badges, levels).

### 1.2 Tech Stack
| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | Tailwind CSS 4, Radix UI, shadcn/ui, Framer Motion |
| **Backend** | Next.js API Routes, PostgreSQL (Supabase) |
| **Authentication** | JWT (jose) + better-auth |
| **Video** | LiveKit (built-in) + Zoom/Google Meet (external) |
| **Storage** | S3 (AWS), Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **State** | SWR, React Hook Form + Zod |
| **Charts** | Recharts |
| **Testing** | Vitest, Testing Library, MSW |
| **PDF** | Puppeteer, pdf-lib, satori |

### 1.3 High-Level Architecture
```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Academy  │ │ Reader   │ │ Community│ │ Public │ │
│  │ (Student │ │ (Reciter │ │ (Forum)  │ │ Pages  │ │
│  │ Teacher  │ │  Admin)  │ │          │ │        │ │
│  │ Admin    │ │          │ │          │ │        │ │
│  │ Parent   │ │          │ │          │ │        │ │
│  │ Super.)  │ │          │ │          │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│                  API Layer (Next.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Academy  │ │ Reader   │ │ Cron     │ │ Auth   │ │
│  │ APIs     │ │ APIs     │ │ Jobs     │ │ APIs   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│              Database (PostgreSQL/Supabase)          │
│  ┌──────────────────────────────────────────────┐   │
│  │ users │ courses │ lessons │ tasks │ sessions │   │
│  │ enrollments │ points_log │ badges │ forum    │   │
│  │ fiqh │ competitions │ halaqat │ certificates│   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│              External Services                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ LiveKit  │ │ S3/Cloud │ │ SMTP     │ │ Zoom   │ │
│  │ (Video)  │ │ (Storage)│ │ (Email)  │ │ Meet   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 2. User Roles

### 2.1 Core Roles
| Role | Identifier | Access Path |
|------|-----------|-------------|
| **Academy Student** | `academy_student` | `/academy/student` |
| **Teacher** | `teacher` | `/academy/teacher` |
| **Academy Admin** | `academy_admin` | `/academy/admin` |
| **Parent** | `parent` | `/academy/parent` |
| **Content Supervisor** | `content_supervisor` | `/academy/content-supervisor` |
| **Fiqh Supervisor** | `fiqh_supervisor` | `/academy/fiqh-supervisor` |
| **Quality Supervisor** | `quality_supervisor` | `/academy/supervisor/quality` |
| **Fiqh Officer** | `supervisor` (fiqh) | `/academy/officer/fiqh` |
| **Reader (Student)** | `reader` | `/reader` |
| **General Admin** | `admin` | `/admin` |
| **Student Supervisor** | `student_supervisor` | `/academy/supervisor` |
| **Reciter Supervisor** | `reciter_supervisor` | Reader admin |

### 2.2 Multi-Role System
- Users can hold **multiple roles** simultaneously
- `academy_roles` field in JWT contains all academy roles
- `platform_preference`: determines preferred platform (academy / reader)
- `has_academy_access`: boolean controlling academy access
- `has_quran_access`: boolean controlling library access

### 2.3 Mode Switcher
- Visible for dual accounts (academy + reader) and admins
- Hidden for academy-only accounts
- Switches between `/academy/student` and other platforms
- Animation: fade + slide using Framer Motion
- Academy color: blue `#1E3A5F`

---

## 3. Infrastructure (Foundation)

### 3.1 Database
- **Type:** PostgreSQL via Supabase
- **Connection:** Connection pooling (max 10, min 2)
- **SSL:** `sslmode=no-verify` for Supabase compatibility
- **Files:** `lib/db.ts` (pool), `lib/db-queries/` (custom queries)

### 3.2 Authentication System
- **Token:** JWT with jose (HS256, 30-day validity)
- **Cookie:** `auth-token` HttpOnly cookie
- **Flow:** `verifyToken()` → `getSession()` → `requireRole()`
- **2FA:** Supported (better-auth config)

### 3.3 Route Protection (RBAC Middleware)
```typescript
// lib/rbac-middleware.ts
verifyAndGetUser(req)          → Extract user from token
checkPermission(role, resource, action) → Verify permission
```

**Rules:**
- Unauthenticated user → `/login`
- No `has_academy_access` → block `/academy/student`
- Parent cannot access data of unlinked child
- Teacher cannot access `/academy/admin` or `/student`

### 3.4 Registration `/register`
- Options: "Academy Only" / "Academy + Reader"
- Default: "Academy + Reader"
- Saves: `has_academy_access`, `platform_preference`
- Configurable required fields (date of birth, gender, country, education level)

---

## 4. Academy Student Pages & Features

### 4.1 Dashboard `/academy/student`
**Components:**
- Stats: courses, points, level, streak
- Upcoming sessions
- Active courses with progress percentage
- Adhkar Widget
- Prayer Times Dialog
- Quick Actions

**API:** `GET /api/academy/student/stats`

### 4.2 Courses

#### Browse Courses `/academy/student/courses/browse`
- Courses displayed by category
- Filter by category and level (beginner/intermediate/advanced)
- Search by name

#### Course Detail `/academy/student/courses/[id]`
- Course description + lesson list
- "Request Enrollment" or "Continue" button based on enrollment status
- Teacher information

#### My Courses `/academy/student/courses`
- Enrolled courses
- Completion percentage per course
- Last completed lesson

#### Lesson `/academy/student/courses/[id]/lessons/[lessonId]`
- Video/audio + materials + description + PDF attachments
- Auto-update progress percentage
- Lesson rating

**APIs:**
- `GET /api/academy/student/courses` — My courses
- `GET /api/academy/student/enrollments` — Enrollment requests
- `GET /api/academy/student/lessons/[id]` — Lesson details

### 4.3 Tasks `/academy/student/tasks`
- Task list with deadlines
- Task details (description and due date)
- Upload file or audio recording for submission
- Status: pending / submitted / graded / late

**API:** `GET/POST /api/academy/student/tasks`

### 4.4 Memorization `/academy/student/memorization`
- Memorization record and progress
- Total display: 6,236 verses + 30 Juz
- **Visual Quran Map:** 604 pages in three colors:
  - Green = Memorized
  - Yellow = Reviewed
  - Gray = Not yet memorized
- Auto-updates after recitation acceptance
- Weekly memorization goal completion confirmation

**API:** `GET/POST /api/academy/student/memorization`

### 4.5 Sessions `/academy/student/sessions`
- Live sessions and recordings
- Session details + join link
- Session reminders

**API:** `GET /api/academy/student/sessions`

### 4.6 Learning Path `/academy/student/path`
- Learning path + progress
- Locked stages shown as `locked`
- Paths: Quran Memorization, Tajweed, Fiqh, Aqeedah, Seerah, Tafseer

### 4.7 Progress `/academy/student/progress`
- Weekly and monthly charts for memorization and review
- Activity rate
- Most subscribed courses

### 4.8 Leaderboard `/academy/student/leaderboard`
- Ranking by points
- Filter: halaqah level / entire platform
- Real-time ranking updates + Animation
- Color-coded Quran map

**API:** `GET /api/academy/leaderboard`

### 4.9 Badges `/academy/student/badges`
- Earned + remaining badges
- Requirements + progress percentages
- Progress tracking (e.g., 67/100)

**API:** `GET /api/academy/student/badges`

### 4.10 Calendar `/academy/student/calendar`
- Session, lesson, task, and deadline schedule
- List view on mobile
- "Join Session" button if today
- Filter by type

**API:** `GET /api/academy/student/calendar`

### 4.11 Enrollment Requests `/academy/student/enrollment-requests`
- Course enrollment request status
- Accept / reject with reason

### 4.12 Certificates `/academy/student/certificates`
- Earned certificates
- PDF download
- Issue data form

**API:** `GET /api/academy/student/certificates`

### 4.13 Chat `/academy/student/chat`
- Conversations with teachers
- Search by name
- Last message + unread indicator

**API:** `GET/POST /api/conversations`

### 4.14 Fiqh `/academy/student/fiqh`
- Submit Islamic jurisprudence questions
- View answered questions
- Question detail + answer
- Custom question fields (powered by `lib/fiqh-helpers.ts`)

**API:** `GET/POST /api/academy/fiqh`

### 4.15 Forum `/academy/student/forum`
- Categories and topics
- Create new topic
- Replies with image support

**API:** `GET/POST /api/academy/forum`

### 4.16 Notifications `/academy/student/notifications`
- Notifications (course accept/reject, new tasks, etc.)
- "Unread" filter
- Bell icon with pulse animation

**API:** `GET /api/notifications`

### 4.17 Profile `/academy/student/profile`
- Edit data
- Preferred platform
- Upload avatar

### 4.18 Parent Requests `/academy/student/parent-requests`
- Parent linking requests
- Accept / reject

**API:** `GET/POST /api/academy/student/parent-requests`

### 4.19 Competitions `/academy/student/competitions`
- Open competitions + dates
- Competition details + submit recitation
- Results

**API:** `GET/POST /api/academy/competitions`

### 4.20 Points `/academy/student/points`
- Points + full history of earned points and reasons
- Point details

**API:** `GET /api/academy/student/points`

### 4.21 Halaqat `/academy/student/halaqat`
- Enrolled halaqat
- Halaqah details

### 4.22 Invitations `/academy/invite/[code]`
- Join a course via invitation code

### 4.23 Series `/academy/student/series`
- View educational series

---

## 5. Academy Teacher Pages & Features

### 5.1 Dashboard `/academy/teacher`
**Components:**
- Stats: courses, students, pending tasks, sessions
- Tasks needing grading
- Upcoming sessions
- Quick Actions

### 5.2 Courses `/academy/teacher/courses`
- Teacher's course list
- Create new course (name + category + level)
- Edit course details
- Manage lessons with Drag & Drop ordering
- Upload video/PDF

**API:** `GET/POST/PATCH /api/academy/teacher/courses`

### 5.3 Tasks `/academy/teacher/tasks`
- Task list and student submissions
- Create new task (individual student or group)
- Task details + per-student status
- Add grade and feedback to submission
- Delete tasks

**API:** `GET/POST/PATCH/DELETE /api/academy/teacher/tasks`

### 5.4 Calendar `/academy/teacher/calendar`
- Manage schedule
- Schedule a session

### 5.5 Students `/academy/teacher/students`
- Students + progress percentage
- Manually create student account

**API:** `GET/POST /api/academy/teacher/students`

### 5.6 Sessions `/academy/teacher/sessions`
- Sessions and links
- Edit / delete
- Start live video session (Zoom/Google Meet integration)
- Past session recordings

**API:** `GET/POST/PATCH/DELETE /api/academy/teacher/sessions`

### 5.7 Live `/academy/teacher/live`
- Start live video session
- LiveKit or Zoom/Meet link
- Send to individual student or group

**API:** `POST/PATCH /api/academy/teacher/live-session`

### 5.8 Halaqat `/academy/teacher/halaqat`
- Managed halaqat
- Manage students and track attendance

**API:** `GET /api/academy/teacher/halaqat`

### 5.9 Enrollment Requests `/academy/teacher/enrollment-requests`
- Join requests + accept / reject

### 5.10 Invitations `/academy/teacher/invitations`
- Create invitation code (e.g., `ITQ-FIQH-2026-A1`)
- Track invitations

**API:** `GET/POST /api/academy/teacher/invitations`

### 5.11 Chat `/academy/teacher/chat`
- Conversations with students
- Sorted by last message + search by name

### 5.12 Notifications `/academy/teacher/notifications`
- Various notifications

### 5.13 Profile `/academy/teacher/profile`
- Profile + specialization and qualification fields

### 5.14 Forum `/academy/teacher/forum`
- Publish articles

### 5.15 Memorization `/academy/teacher/memorization`
- Track all students' memorization progress

**API:** `GET /api/academy/teacher/memorization`

### 5.16 Memorization Goals `/academy/teacher/memorization-goals` (integrated in `paths`)
- Set weekly memorization goals per student (verses/pages)
- Track achievement

**API:** `GET/POST /api/academy/teacher/memorization`

### 5.17 Parent Messages `/academy/teacher/parent-messages`
- Messages from parents

### 5.18 Public Lessons `/academy/teacher/public-lessons`
- Manage open public lessons

**API:** `GET/POST /api/academy/teacher/public-lessons`

### 5.19 Certificates `/academy/teacher/certificates`
- Manage student certificates

### 5.20 Paths `/academy/teacher/paths`
- Track educational paths

**Workflow:** Uploaded lessons go to "Pending Supervisor Review" before publishing.

---

## 6. Academy Admin Pages & Features

### 6.1 Dashboard `/academy/admin`
**Components:**
- Stats: students, teachers, courses, enrollments
- Interactive charts
- Quick Actions
- Recent activity

**API:** `GET /api/academy/admin/stats`

### 6.2 Course Management `/academy/admin/courses`
- Manage all courses + assign dedicated teacher
- Course status: draft / published / archived
- Course level: beginner / intermediate / advanced

**API:** `GET/POST/PATCH /api/academy/admin/courses`

### 6.3 Categories `/academy/admin/categories`
- Add / edit / delete course categories

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/categories`

### 6.4 Teachers `/academy/admin/teachers`
- Teacher list + statistics

**API:** `GET /api/academy/admin/teachers`

### 6.5 Teacher Applications `/academy/admin/teacher-applications`
- Teacher join requests
- Accept / reject with reason

**API:** `GET/PATCH /api/academy/admin/teacher-applications`

### 6.6 Students `/academy/admin/students`
- Academy students + statistics

**API:** `GET /api/academy/admin/students`

### 6.7 Learning Paths `/academy/admin/learning-paths`
- Create and manage educational paths
- Assign a fiqh path manager
- Path stages with status (locked/unlocked/completed)

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/paths`

### 6.8 Access Control `/academy/admin/access-control`
- Manage permissions
- Change `has_academy_access`
- Log: "who changed what and when"

**API:** `GET/PATCH /api/academy/admin/users`

### 6.9 Invitations `/academy/admin/invitations`
- Send invitations + track them

**API:** `GET/POST /api/academy/admin/invitations`

### 6.10 Competitions `/academy/admin/competitions`
- Create and manage competitions
- Define participants
- Manage required files
- Competition scope: academy / halaqah

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/competitions`

### 6.11 Leaderboard `/academy/admin/leaderboard`
- Manage points and rankings
- Log how students earned their points

**API:** `GET /api/academy/admin/leaderboard`

### 6.12 Badges `/academy/admin/badges`
- Create and manage badges
- Upload custom images
- Edit requirements
- Manual award
- Categories: recitation, courses, tasks, streak, competitions, special

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/badges`

### 6.13 Forum `/academy/admin/forum`
- Manage forum and moderation
- Create forums
- Delete violating replies

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/forum`

### 6.14 Fiqh `/academy/admin/fiqh`
- Review all questions and answers
- Assign fiqh supervisors/officers

**API:** `GET/PATCH /api/academy/admin/fiqh`

### 6.15 Announcements `/academy/admin/announcements`
- Publish announcements
- Target specific roles

**API:** `GET/POST /api/academy/admin/announcements`

### 6.16 Reports `/academy/admin/reports`
- Enrollment, completion, and teacher reports
- Export (CSV / PDF)

**API:** `GET /api/academy/admin/analytics`

### 6.17 Analytics `/academy/admin/analytics`
- Interactive charts
- Export analytics
- Geographic analytics

**API:** `GET /api/academy/admin/analytics`

### 6.18 Halaqat `/academy/admin/halaqat`
- Create halaqah (name + gender + teacher + schedule + category)
- Manage students and track attendance
- Link to course

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/halaqat`

### 6.19 Settings `/academy/admin/settings`
- Academy settings (10 sections, ~81 fields)
- Full control over platform behavior

**Sections:**
1. **General** — Academy name, logo, favicon, language, timezone
2. **Registration** — Self-registration, approval, required fields
3. **Courses & Content** — Supervisor approval, size limits, storage service
4. **Live Sessions** — Video provider, session duration, reminders
5. **Gamification** — Points, levels, badges, leaderboard
6. **Notifications & Email** — SMTP, email events, schedules
7. **Forum & Fiqh** — Enable forum/fiqh, settings
8. **Security & Privacy** — Sessions, 2FA, IP Whitelist, Rate Limiting
9. **Maintenance** — Maintenance mode, cache clear, backup

**APIs:**
- `GET /api/academy/admin/settings` — Get settings
- `PUT /api/academy/admin/settings` — Save settings
- `POST /api/academy/admin/settings/test-email` — Test SMTP
- `POST /api/academy/admin/settings/cache-clear` — Clear cache
- `POST /api/academy/admin/settings/backup` — Export backup

### 6.20 Points Management `/academy/admin/points`
- Manage point values per event
- Level thresholds

**API:** `GET/PUT /api/academy/admin/points`

### 6.21 Supervisors `/academy/admin/supervisors`
- Assign and manage supervisors

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/supervisors`

### 6.22 Archive `/academy/admin/archive`
- General archive

### 6.23 Conversations `/academy/admin/conversations`
- Review conversations

### 6.24 Users `/academy/admin/users`
- General user management

### 6.25 Library `/academy/admin/library`
- Manage library content

### 6.26 Series `/academy/admin/series`
- Manage educational series

### 6.27 Public Lessons `/academy/admin/public-lessons`
- Manage open public lessons

### 6.28 Certificates `/academy/admin/certificates`
- Manage certificates

### 6.29 Video Settings `/academy/admin/video-settings`
- Video and streaming settings

---

## 7. Parent Pages & Features

### 7.1 Dashboard `/academy/parent`
- Performance summary for all linked children
- Alerts (overdue tasks, absences)
- Quick stats

**API:** `GET /api/academy/parent/overview`

### 7.2 Link Child `/academy/parent/link-child`
- Enter child's email
- Select relationship type (father/mother/guardian)
- Send linking request

**API:** `POST /api/academy/parent/link-child`

### 7.3 Children `/academy/parent/children`
- All children + active courses
- Progress percentage
- Remove link

**API:** `GET /api/academy/parent/children`

### 7.4 Reports `/academy/parent/reports`
- Select child + time period
- View report (attendance, tasks, grades)
- Export PDF

**API:** `GET /api/academy/parent/reports`

### 7.5 Progress `/academy/parent/progress`
- Completion percentage charts
- Child's badges + level and points
- Attended/missed sessions
- Compare between children

**API:** `GET /api/academy/parent/progress`

### 7.6 Notifications `/academy/parent/notifications`
- Child performance notifications

### 7.7 Messages `/academy/parent/messages`
- Two-way messaging with the teacher

**API:** `GET /api/academy/parent/reader-conversations`

### 7.8 Restrictions `/academy/parent/restrictions`
- Set allowed surahs/paths for child
- Locked / hidden in child's interface

**API:** `GET/POST /api/academy/parent/restrictions`

### 7.9 Profile `/academy/parent/profile`
- Edit data

### 7.10 Calendar `/academy/parent/calendar`
- Children's schedule

### 7.11 Teachers `/academy/parent/teachers`
- View children's linked teachers

---

## 8. Supervisor Pages & Features

### 8.1 Content Supervisor `/academy/content-supervisor`
| Route | Description |
|-------|-------------|
| `/academy/content-supervisor` | Dashboard: pending lessons by status |
| `/academy/content-supervisor/lessons` | Review lessons (pending review / accepted / rejected) |
| `/academy/content-supervisor/courses` | Manage courses |
| `/academy/content-supervisor/paths` | Track paths |
| `/academy/content-supervisor/academy-paths` | Manage academy paths |
| `/academy/content-supervisor/series` | Manage series |
| `/academy/content-supervisor/archive` | Archive |
| `/academy/content-supervisor/messages` | Messages |
| `/academy/content-supervisor/notifications` | Notifications |
| `/academy/content-supervisor/profile` | Profile |

**Workflow:** Accept / reject with written reason

### 8.2 Fiqh Supervisor `/academy/fiqh-supervisor`
| Route | Description |
|-------|-------------|
| `/academy/fiqh-supervisor` | Dashboard: questions by status (new / under review / answered / rejected) |
| `/academy/fiqh-supervisor/questions` | Pending questions + write answer (rich text) + publish |
| `/academy/fiqh-supervisor/messages` | Messaging system |
| `/academy/fiqh-supervisor/notifications` | Notifications |
| `/academy/fiqh-supervisor/profile` | Profile |

### 8.3 Quality Supervisor `/academy/supervisor/quality`
- Quality statistics (average teacher grades, evaluation time, complaints)
- View evaluations (read-only)
- Write report and send to admin

### 8.4 General Supervisor `/academy/supervisor`
| Route | Description |
|-------|-------------|
| `/academy/supervisor` | General dashboard |
| `/academy/supervisor/content` | Review content |
| `/academy/supervisor/forum` | Forum moderation |
| `/academy/supervisor/teachers` | Track teachers |
| `/academy/supervisor/notifications` | Notifications |
| `/academy/supervisor/quality` | Quality monitoring |

### 8.5 Fiqh Officer `/academy/officer/fiqh`
- Manage assigned fiqh questions

---

## 9. Cross-cutting Features

### 9.1 Points System
| Event | Points |
|-------|--------|
| Recitation submission | +10 |
| Recitation accepted as "mastered" | +30 |
| Task completion | +15 |
| Lesson attendance | +20 |
| New streak day | +5 |
| Juz completion | +100 |
| Session attendance | +20 |
| Forum answer | +25 |
| Competition win | +500 |
| Competition 2nd place | +300 |
| Competition 3rd place | +150 |
| Streak ≥ 3 days multiplier | ×2.0 |
| Streak ≥ 7 days multiplier | ×2.0 |
| Streak ≥ 30 days multiplier | ×2.0 |

**Files:** `lib/academy/gamification.ts`, `lib/academy/points.ts`

### 9.2 Levels System
| Level | Points Required |
|-------|----------------|
| Beginner | 0–500 |
| Intermediate | 500–2,000 |
| Advanced | 2,000–5,000 |
| Hafiz | 5,000–10,000 |
| Master | 10,000+ |

- Automatic promotion + notification + unlock additional features

### 9.3 Streak Counter
- Increments with daily recitation submission
- Resets on missed day
- End-of-day reminder (cron job)
- Columns: `user_points.streak_days`, `user_points.longest_streak`

### 9.4 Badges

#### Automatic Badges
| Badge | Condition | Points |
|-------|-----------|--------|
| First Recitation | First recitation | +20 |
| Week Streak 7 | 7 consecutive days | +70 |
| Juz Amma Hafiz | Complete Juz 30 | +200 |
| Hundred Recitations | 100 recitations | +150 |
| Tajweed Master | Complete Tajweed path | +300 |
| Ramadan Badge | Ramadan activity | +250 |
| Full Quran | Complete Quran | +1,000 |
| Star of Halaqah | Best performance in halaqah | +180 |
| First Course | Enroll in first course | — |
| Five Courses | 5 completed courses | — |
| Ten Courses | 10 completed courses | — |
| First Task | Complete first task | — |
| Task Master | 50 completed tasks | — |
| Early Bird | Submit before noon | — |
| Night Owl | Submit after Maghrib | — |
| Helper | Answer in forum | — |

**System:** `badge_definitions` table + `badges` table (user earned)

### 9.5 Educational Paths

#### Quran Paths
- **Quran Memorization:** Ordered from Juz Amma to full Quran
  - Units: juz / surah / hizb / page / custom range
  - Direction: asc (small to large) or desc
- **Tajweed:** Sequential stages (10 default stages)
  - Unlocks only after passing previous stage with reciter evaluation
  - Stages: Letter exits → Letter attributes → Noon rules → ... → Final application

#### Islamic Sciences Paths
- Fiqh (10 default stages)
- Aqeedah
- Seerah
- Tafseer

**Files:** `lib/memorization-paths.ts`, `lib/tajweed-paths.ts`

### 9.6 Competitions
- Monthly recitation competition
- Ramadan competition (track monthly memorized verses)
- Tajweed competition (identify required rules)
- Competition scope: academy / halaqah
- Judge + Rank + Points control
- Winner announcement + badge + multiplied points

**API:** `GET/POST/PATCH/DELETE /api/academy/admin/competitions`

### 9.7 Leaderboard
- Ranking by points
- Filter: halaqah / entire platform
- Real-time ranking updates + Animation
- Separate competition rankings

### 9.8 Built-in Video Calls
- **Primary provider:** LiveKit (built-in)
- **Alternative providers:** Zoom / Google Meet
- Create session + add link
- Send to individual student or group
- Expires after session ends
- Waiting Room support
- Webhook for tracking

**APIs:**
- `POST /api/livekit/token` — Generate token
- `POST /api/livekit/public-token` — Public token
- `GET /api/livekit/waiting-room` — Waiting room
- `POST /api/livekit/webhook` — Session tracking

### 9.9 Performance Statistics
- Weekly and monthly completion charts
- Activity rate + most enrolled courses
- Export CSV / PDF
- Geographic analytics

### 9.10 Library `/academy/library`
- Islamic books and references
- Multiple categories
- Cover and title display

**API:** `GET /api/academy/admin/library`

### 9.11 Series `/academy/admin/series`
- Ordered lesson series
- Episode management

### 9.12 Public Lessons
- Open courses available to everyone
- No registration required
- Shareable via direct links

### 9.13 Unified Calendar
- Sessions, lessons, and tasks schedule
- Filter by type
- Google Calendar integration (planned)

### 9.14 Messaging
- Two-way conversations
- Search by name
- Last message + unread count
- Parent-teacher messaging

### 9.15 Evaluation System
- Student lesson ratings
- Teacher evaluation (quality monitoring)
- Task grades

### 9.16 Certificate System
- Course completion certificates
- Automatic PDF generation
- Customizable issue data
- Custom design with academy logo

---

## 10. Main APIs

### 10.1 Auth & Access
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |
| `/api/me` | GET | Current user data |
| `/api/academy/admin/access-control` | GET/PATCH | Manage permissions |
| `/api/academy/admin/points` | GET/PUT | Manage points |
| `/api/academy/student/points` | GET | Student points |

### 10.2 Student
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/student/stats` | GET | Student statistics |
| `/api/academy/student/courses` | GET | Student courses |
| `/api/academy/student/enrollments` | GET | Enrollment requests |
| `/api/academy/student/calendar` | GET | Calendar |
| `/api/academy/student/memorization` | GET/POST | Memorization |
| `/api/academy/student/badges` | GET | Badges |
| `/api/academy/student/parent-requests` | GET/POST | Parent requests |
| `/api/academy/student/competitions` | GET/POST | Competitions |
| `/api/academy/student/points` | GET | Points |
| `/api/academy/student/tasks` | GET/POST | Tasks |
| `/api/academy/student/sessions` | GET | Sessions |
| `/api/academy/student/lessons/[id]` | GET | Lesson |
| `/api/academy/student/paths` | GET | Paths |
| `/api/academy/student/certificates` | GET | Certificates |
| `/api/academy/student/teachers` | GET | Teachers |
| `/api/academy/student/fiqh` | GET/POST | Fiqh |
| `/api/academy/student/series` | GET | Series |

### 10.3 Teacher
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/teacher/courses` | GET/POST | Courses |
| `/api/academy/teacher/tasks` | GET/POST/PATCH/DELETE | Tasks |
| `/api/academy/teacher/students` | GET/POST | Students |
| `/api/academy/teacher/sessions` | GET/POST/PATCH/DELETE | Sessions |
| `/api/academy/teacher/live-session` | POST/PATCH | Live streaming |
| `/api/academy/teacher/memorization` | GET/POST | Memorization |
| `/api/academy/teacher/invitations` | GET/POST | Invitations |
| `/api/academy/teacher/calendar` | GET | Calendar |
| `/api/academy/teacher/enrollment-requests` | GET | Enrollment requests |
| `/api/academy/teacher/certificates` | GET | Certificates |
| `/api/academy/teacher/paths` | GET | Paths |
| `/api/academy/teacher/public-lessons` | GET/POST | Public lessons |
| `/api/academy/teacher/profile` | GET/PATCH | Profile |
| `/api/academy/teacher/competitions` | GET | Competitions |

### 10.4 Admin
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/admin/stats` | GET | General statistics |
| `/api/academy/admin/courses` | GET/POST/PATCH | Courses |
| `/api/academy/admin/categories` | GET/POST/PATCH/DELETE | Categories |
| `/api/academy/admin/teachers` | GET | Teachers |
| `/api/academy/admin/teacher-applications` | GET/PATCH | Teacher applications |
| `/api/academy/admin/students` | GET | Students |
| `/api/academy/admin/paths` | GET/POST/PATCH/DELETE | Paths |
| `/api/academy/admin/invitations` | GET/POST | Invitations |
| `/api/academy/admin/competitions` | GET/POST/PATCH/DELETE | Competitions |
| `/api/academy/admin/leaderboard` | GET | Leaderboard |
| `/api/academy/admin/badges` | GET/POST/PATCH/DELETE | Badges |
| `/api/academy/admin/forum` | GET/POST/PATCH/DELETE | Forum |
| `/api/academy/admin/fiqh` | GET/PATCH | Fiqh |
| `/api/academy/admin/announcements` | GET/POST | Announcements |
| `/api/academy/admin/analytics` | GET | Analytics |
| `/api/academy/admin/halaqat` | GET/POST/PATCH/DELETE | Halaqat |
| `/api/academy/admin/settings` | GET/PUT | Settings |
| `/api/academy/admin/supervisors` | GET/POST/PATCH/DELETE | Supervisors |
| `/api/academy/admin/users` | GET/PATCH | Users |
| `/api/academy/admin/library` | GET/POST | Library |
| `/api/academy/admin/series` | GET/POST | Series |
| `/api/academy/admin/public-lessons` | GET/POST | Public lessons |
| `/api/academy/admin/certificates` | GET | Certificates |
| `/api/academy/admin/video-settings` | GET/PUT | Video settings |
| `/api/academy/admin/archive` | GET | Archive |
| `/api/academy/admin/contact-messages` | GET | Contact messages |

### 10.5 Parent
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/parent/overview` | GET | Overview |
| `/api/academy/parent/link-child` | POST | Link child |
| `/api/academy/parent/children` | GET | Children |
| `/api/academy/parent/progress` | GET | Progress |
| `/api/academy/parent/reports` | GET | Reports |
| `/api/academy/parent/restrictions` | GET/POST | Restrictions |
| `/api/academy/parent/reader-conversations` | GET | Conversations |
| `/api/academy/parent/calendar` | GET | Calendar |
| `/api/academy/parent/teachers` | GET | Teachers |

### 10.6 Fiqh
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/fiqh` | GET/POST | Questions |
| `/api/academy/fiqh/[id]` | GET/PATCH | Specific question |
| `/api/academy/fiqh/categories` | GET | Categories |
| `/api/academy/fiqh/fields` | GET | Custom fields |
| `/api/academy/fiqh/me` | GET | My questions |

### 10.7 Forum
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/forum` | GET/POST | Topics |
| `/api/academy/forum/[id]` | GET/PATCH/DELETE | Specific topic |

### 10.8 Conversations
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/conversations` | GET/POST | Conversations |
| `/api/conversations/[id]` | GET | Specific conversation |
| `/api/unread-counts` | GET | Unread count |

### 10.9 Certificates
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/certificate` | GET | Certificate |
| `/api/certificate-pdf` | GET | Download PDF |

### 10.10 Leaderboard
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/academy/leaderboard` | GET | Leaderboard |

### 10.11 LiveKit
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/livekit/token` | POST | Private token |
| `/api/livekit/public-token` | POST | Public token |
| `/api/livekit/waiting-room` | GET | Waiting room |
| `/api/livekit/webhook` | POST | Tracking |

### 10.12 General Services
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/upload` | POST | File upload |
| `/api/upload-audio` | POST | Audio upload |
| `/api/upload-pdf` | POST | PDF upload |
| `/api/audio-proxy` | GET | Audio proxy |
| `/api/pdf-proxy` | GET | PDF proxy |
| `/api/notifications` | GET | Notifications |
| `/api/community/articles` | GET/POST | Community articles |
| `/api/halaqat` | GET | Halaqat |
| `/api/stats` | GET | General statistics |
| `/api/prayer-times` | GET | Prayer times |
| `/api/public-settings` | GET | Public settings |

---

## 11. Notifications & Cron Jobs

### 11.1 Notification Channels
- In-platform (Bell icon with pulse animation)
- Email (SMTP via Nodemailer)

### 11.2 Notification Events
| Event | Recipient |
|-------|-----------|
| Teacher application accept/reject | Teacher |
| Course enrollment request received | Teacher |
| Enrollment accept/reject | Student |
| New task received | Student |
| Task graded | Student |
| Session link received | Student |
| 1-hour session reminder | Student |
| 10-minute session reminder | Student |
| Forum reply received | Topic creator |
| Level promotion | Student |
| New badge | Student |
| Streak end-of-day warning | Student |
| Parent linking request | Child + Parent |
| Fiqh answer | Question asker |
| Question rejection with reason | Question asker |
| Parent weekly report | Parent |
| Daily werd reminder | Student |

### 11.3 Cron Jobs
| Endpoint | Description | Schedule |
|----------|-------------|----------|
| `/api/cron/session-reminders` | Session reminders | Hourly |
| `/api/cron/task-reminders` | Task reminders + overdue alerts | Daily morning |
| `/api/cron/streak-reminders` | Streak reminders | Daily evening |
| `/api/cron/parent-weekly-reports` | Parent weekly reports | Weekly |
| `/api/cron/admin-activity-reports` | Admin reports | Weekly/Monthly |
| `/api/cron/academy-reminders` | General academy reminders | Daily |
| `/api/cron/check-expirations` | Check expirations | Daily |
| `/api/cron/werd-reminders` | Daily werd reminders | Daily |
| `/api/cron/auto-end-sessions` | End completed sessions | Every 5 minutes |
| `/api/cron/recover-multipart` | Recover multipart files | Daily |
| `/api/cron/reminders` | General reminders | Daily |

---

## 12. Security & Permissions

### 12.1 API Route Protection
- All API routes protected with authentication and authorization
- JWT verification on every request
- RBAC middleware for role verification

### 12.2 Access Rules
| Rule | Detail |
|------|--------|
| Parent | Cannot access data of unlinked child |
| Student | Cannot access `/academy/admin` |
| Teacher | Cannot access `/academy/admin` or `/student` |
| Supervisor | Can only access their designated sections |
| Admin | Full access |

### 12.3 Technical Security
- JWT with HS256 + 30-day expiry
- HttpOnly cookies
- SSL for database connection
- Rate Limiting (planned)
- Input validation with Zod
- SQL injection protection (parameterized queries)
- XSS protection (React auto-escaping)

### 12.4 Two-Factor Authentication (2FA)
- Supported via better-auth
- Email OTP
- Authenticator App

### 12.5 Activity Log
- `activity_log` table
- Tracks: who did what and when
- For sensitive changes (permissions, settings)

---

## 13. UI/UX Requirements

### 13.1 Color System
| Element | Color |
|---------|-------|
| Primary (Academy) | `#1E3A5F` |
| Secondary | Blue derivatives |
| Danger | `#EF4444` |
| Success | `#22C55E` |
| Warning | `#FBBF24` |
| Background | White / light gray |

### 13.2 Dark Mode
- Available on all academy pages
- No unreadable elements/text
- Built-in Theme Provider

### 13.3 Responsive Design
- Lesson page (video) on mobile
- Academy chat on mobile
- Calendar switches to list view
- Task submission page
- All lists work on small screens
- Mode Switcher adapts to screen size

### 13.4 Animations
| Feature | Animation |
|---------|-----------|
| Mode Switcher | fade + slide |
| Progress bar | animated |
| New notification badge | Pulse |
| Enrollment step indicator | Step animation |
| Leaderboard ranking change | Sort animation |
| Skeleton Loaders | smooth rectangles |

### 13.5 UI Components
- shadcn/ui (built on Radix UI)
- Dialog, Dropdown, Tabs, Accordion
- Toast notifications (Sonner)
- Command palette (cmdk)
- Calendar (react-day-picker)
- Charts (Recharts)
- Form validation (React Hook Form + Zod)

---

## 14. Performance & Stability

### 14.1 Performance Requirements
- Page load time under 3 seconds
- No memory leaks
- No duplicate API requests
- All pages connected to DB (no mock data)

### 14.2 Optimization Strategies
- SWR for caching and revalidation
- Optimistic updates with rollback
- Skeleton Loaders instead of Spinners
- Image optimization (Sharp)
- Automatic code splitting (Next.js)

### 14.3 Testing
- **Unit Tests:** Vitest
- **Component Tests:** Testing Library
- **API Mocking:** MSW
- **E2E Tests:** Planned (Playwright)

---

## 15. Database Schema

### 15.1 Core Tables
| Table | Description |
|-------|-------------|
| `users` | Core users |
| `courses` | Courses |
| `lessons` | Lessons |
| `enrollments` | Enrollments |
| `tasks` | Tasks |
| `task_submissions` | Task submissions |
| `sessions` | Sessions |
| `session_attendance` | Session attendance |
| `user_points` | User points |
| `points_log` | Points log |
| `badge_definitions` | Badge definitions |
| `badges` | Earned badges |
| `competitions` | Competitions |
| `competition_entries` | Competition entries |
| `memorization_records` | Memorization records |
| `memorization_goals` | Memorization goals |
| `memorization_paths` | Memorization paths |
| `memorization_path_units` | Memorization path units |
| `tajweed_paths` | Tajweed paths |
| `tajweed_stages` | Tajweed stages |
| `learning_paths` | Learning paths |
| `learning_path_stages` | Learning path stages |
| `fiqh_questions` | Fiqh questions |
| `fiqh_answers` | Fiqh answers |
| `fiqh_categories` | Fiqh categories |
| `fiqh_custom_fields` | Custom fiqh fields |
| `forum_topics` | Forum topics |
| `forum_replies` | Forum replies |
| `forum_categories` | Forum categories |
| `conversations` | Conversations |
| `messages` | Messages |
| `notifications` | Notifications |
| `halaqat` | Halaqat |
| `halaqah_enrollments` | Halaqah enrollments |
| `certificates` | Certificates |
| `announcements` | Announcements |
| `invitations` | Invitations |
| `parent_children` | Parent-child relationship |
| `parent_restrictions` | Parent restrictions |
| `activity_log` | Activity log |
| `academy_system_settings` | System settings |
| `categories` | General categories |
| `series` | Series |
| `books` | Books |
| `book_categories` | Book categories |
| `public_lessons` | Public lessons |
| `contact_messages` | Contact messages |
| `supervisors` | Supervisors |
| `application_questions` | Application questions |

### 15.2 Key Relationships
```
users ──< enrollments >── courses
users ──< tasks >── courses
users ──< task_submissions >── tasks
users ──< sessions >── courses
users ──< session_attendance >── sessions
users ──< user_points
users ──< points_log
users ──< badges >── badge_definitions
users ──< memorization_records
users ──< memorization_goals
users ──< parent_children >── users (parent)
courses ──< lessons
courses ──< enrollments >── users
memorization_paths ──< memorization_path_units
tajweed_paths ──< tajweed_stages
learning_paths ──< learning_path_stages
competitions ──< competition_entries >── users
fiqh_questions ──< fiqh_answers
forum_topics ──< forum_replies
conversations ──< messages
halaqat ──< halaqah_enrollments >── users
```

---

## 16. Development Phases

### Phase 1: Foundation ✅
- [x] User and role system
- [x] Authentication (JWT)
- [x] Database (Supabase/PostgreSQL)
- [x] Public interface

### Phase 2: Courses & Lessons ✅
- [x] Course creation and management
- [x] Lesson upload (video/PDF)
- [x] Enrollment system
- [x] Progress tracking

### Phase 3: Memorization & Review ✅
- [x] Memorization record
- [x] Memorization goals
- [x] Memorization paths
- [x] Visual Quran map

### Phase 4: Gamification ✅
- [x] Points system
- [x] Levels system
- [x] Streak counter
- [x] Badges

### Phase 5: Social Features ✅
- [x] Forum
- [x] Fiqh
- [x] Messaging
- [x] Notifications

### Phase 6: Parent Portal ✅
- [x] Child linking
- [x] Progress tracking
- [x] Reports
- [x] Restrictions

### Phase 7: Live Streaming ✅
- [x] LiveKit integration
- [x] Zoom/Google Meet support
- [x] Waiting room

### Phase 8: Educational Paths ✅
- [x] Memorization paths
- [x] Tajweed paths
- [x] Islamic sciences paths

### Phase 9: Competitions ✅
- [x] Competition system
- [x] Registration and submission
- [x] Evaluation

### Phase 10: Settings & Analytics ✅
- [x] Admin settings (10 sections)
- [x] Analytics and reports
- [x] Export (CSV/PDF)

### Phase 11: Enhancements 🔜
- [ ] Rate Limiting
- [ ] E2E Tests (Playwright)
- [ ] PWA support
- [ ] Offline mode for memorization
- [ ] Full translation (Arabic/English)
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 17. Technical Notes

### 17.1 Gamification Files
- `lib/academy/gamification.ts` — **Single source of truth** for production points and badges
- `lib/academy/points.ts` — Written against older schema, being deprecated
- `lib/academy/badges.ts` — Earned badge definition management

### 17.2 Internationalization
- `lib/i18n/` — Built-in translation system
- `useI18n()` hook for using translations
- RTL/LTR support

### 17.3 Storage
- S3 (AWS) for large files
- Cloudinary as alternative
- Supabase Storage for small files

### 17.4 Communication Channels
- **LiveKit:** Built-in video (integrated)
- **Zoom/Google Meet:** External video (shared links)
- **Nodemailer:** Emails (SMTP)

---

*This document was created based on a comprehensive analysis of the project codebase.*
*Last Updated: June 21, 2026*
