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

## 18. Test Scenarios

### 18.1 Authentication & Access Control

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| AC-01 | Student login | Enter valid credentials → Submit | Redirect to `/academy/student` |
| AC-02 | Teacher login | Enter valid credentials → Submit | Redirect to `/academy/teacher` |
| AC-03 | Admin login | Enter valid credentials → Submit | Redirect to `/academy/admin` |
| AC-04 | Parent login | Enter valid credentials → Submit | Redirect to `/academy/parent` |
| AC-05 | Invalid credentials | Enter wrong password → Submit | Show error message, no redirect |
| AC-06 | Registration - Academy only | Select "Academy Only" → Complete | `has_academy_access=true`, no mode switcher |
| AC-07 | Registration - Academy + Reader | Select "Academy + Reader" → Complete | `has_academy_access=true`, mode switcher visible |
| AC-08 | Unauthenticated access | Navigate to `/academy/student` without login | Redirect to `/login` |
| AC-09 | No academy access | Student without `has_academy_access` tries `/academy/student` | Blocked, redirect or 403 |
| AC-10 | Student tries admin | Student navigates to `/academy/admin` | Blocked, 403 or redirect |
| AC-11 | Teacher tries admin | Teacher navigates to `/academy/admin` | Blocked, 403 or redirect |
| AC-12 | Parent accesses unrelated child | Parent tries to view unlinked child's data | Blocked, no data returned |
| AC-13 | JWT expiry | Wait for token expiry → Make request | Redirect to `/login` |
| AC-14 | Mode Switcher toggle | Click mode switcher → Switch to Reader | Smooth transition, correct platform loads |
| AC-15 | Session persistence | Login → Close browser → Reopen | Session maintained, no re-login |

### 18.2 Academy Student Learning

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| SL-01 | View dashboard | Login as student → Open dashboard | Stats display: courses, points, level, streak |
| SL-02 | Browse courses | Navigate to browse → Filter by category | Courses filtered correctly |
| SL-03 | Browse courses by level | Filter by "Beginner" | Only beginner courses shown |
| SL-04 | Search courses | Type course name in search | Matching courses displayed |
| SL-05 | View course detail | Click course → View detail page | Description, lessons list, teacher info shown |
| SL-06 | Request enrollment | Click "Request Enrollment" | Request sent, status shown as pending |
| SL-07 | View my courses | Navigate to "My Courses" | Enrolled courses with progress % shown |
| SL-08 | Open lesson | Click lesson → Lesson page loads | Video/audio, materials, description, PDF attachments |
| SL-09 | Lesson progress auto-update | Complete watching lesson | Progress percentage updates automatically |
| SL-10 | Submit task | Navigate to tasks → Open task → Upload file | Submission recorded, status changes to "submitted" |
| SL-11 | Submit task - audio | Record audio → Submit | Audio uploaded, submission recorded |
| SL-12 | View memorization record | Navigate to memorization | Record shows total verses (6236) and juz (30) |
| SL-13 | Quran map colors | View visual Quran map | Green=memo, Yellow=reviewed, Gray=not memo |
| SL-14 | Quran map auto-update | Teacher accepts recitation | Map updates automatically |
| SL-15 | View learning path | Navigate to path page | Path stages displayed, locked ones show `locked` |
| SL-16 | View progress charts | Navigate to progress | Weekly/monthly charts render correctly |
| SL-17 | View leaderboard | Navigate to leaderboard | Rankings displayed, filter works |
| SL-18 | View badges | Navigate to badges | Earned + remaining badges shown with progress |
| SL-19 | Calendar - view events | Open calendar | Sessions, lessons, tasks, deadlines displayed |
| SL-20 | Calendar - mobile view | Open calendar on mobile | Switches to list view |
| SL-21 | Calendar - join session | Click "Join Session" on today's session | Redirects to session/video |
| SL-22 | Download certificate | Navigate to certificates → Download PDF | PDF downloads with correct data |
| SL-23 | View points history | Navigate to points | Full history with reasons displayed |
| SL-24 | View halaqat | Navigate to halaqat | Enrolled halaqat listed |
| SL-25 | Join via invitation code | Enter valid code at `/invite/[code]` | Enrolled in course |
| SL-26 | Join via invalid code | Enter invalid/expired code | Error message shown |
| SL-27 | View series | Navigate to series | Series listed with episodes |
| SL-28 | Quick actions | Click quick action on dashboard | Correct page/action triggered |

### 18.3 Academy Student Communication & Community

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| SC-01 | Open chat | Navigate to chat | Conversations list with last message |
| SC-02 | Search teacher in chat | Type teacher name | Filtered results shown |
| SC-03 | Send message | Select conversation → Type message → Send | Message delivered, appears in chat |
| SC-04 | Submit fiqh question | Navigate to fiqh → Fill form → Submit | Question created, status "pending" |
| SC-05 | View fiqh answer | Open answered question | Question + answer displayed |
| SC-06 | Browse forum categories | Navigate to forum | Categories listed |
| SC-07 | Create forum topic | Click "New Topic" → Fill → Submit | Topic published, appears in category |
| SC-08 | Reply to topic | Open topic → Type reply → Submit | Reply added, topic creator notified |
| SC-09 | Filter notifications | Click "Unread" filter | Only unread notifications shown |
| SC-10 | Mark notification as read | Click notification | Marked as read, bell count decreases |
| SC-11 | Parent linking request | Receive request → Accept | Link established, parent sees child data |
| SC-12 | Parent linking request - reject | Receive request → Reject | Request rejected, no link created |
| SC-13 | Accept enrollment | Receive enrollment notification → Accept | Student enrolled, notification sent |
| SC-14 | Reject enrollment | Receive enrollment notification → Reject with reason | Student notified with reason |
| SC-15 | Enter invitation code | Navigate to `/invite/[code]` with valid code | Enrollment form shown |
| SC-16 | View notifications | Bell icon shows count | Correct unread count displayed |

### 18.4 Academy Teacher Course Delivery

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| TD-01 | View teacher dashboard | Login as teacher → Dashboard loads | Stats: courses, students, pending tasks, sessions |
| TD-02 | Create course | Click "New Course" → Fill details → Save | Course created, status "draft" |
| TD-03 | Edit course | Open course → Edit details → Save | Course updated |
| TD-04 | Upload lesson | Open course lessons → Upload video/PDF | Lesson uploaded, status "pending review" |
| TD-05 | Reorder lessons | Drag & drop lessons | Order saved correctly |
| TD-06 | Create task | Click "New Task" → Set details → Save | Task created, assigned to students |
| TD-07 | Create task - individual | Select specific student | Task assigned to that student only |
| TD-08 | Grade submission | Open task → View submission → Add grade + notes | Grade saved, student notified |
| TD-09 | View student list | Navigate to students | Students with progress % listed |
| TD-10 | Create student account | Click "Create Student" → Fill form | Account created |
| TD-11 | Start live session | Click "Start Live" → Select students | Session created, link generated |
| TD-12 | Schedule session | Navigate to sessions → Schedule new | Session scheduled, reminders set |
| TD-13 | Delete session | Select session → Delete | Session removed |
| TD-14 | Create invitation | Navigate to invitations → Create code | Code generated (e.g., `ITQ-FIQH-2026-A1`) |
| TD-15 | View recordings | Navigate to recordings | Past session recordings listed |
| TD-16 | View memorization progress | Navigate to memorization | All students' progress displayed |
| TD-17 | Set memorization goals | Select student → Set weekly goals | Goals saved, tracking enabled |
| TD-18 | Accept enrollment request | View request → Accept | Student enrolled, notification sent |
| TD-19 | Reject enrollment request | View request → Reject with reason | Student notified with reason |
| TD-20 | Manage halaqat | Navigate to halaqat | Managed halaqat listed |
| TD-21 | Send parent message | Navigate to parent messages → Send | Message delivered to parent |
| TD-22 | Publish public lesson | Create public lesson → Publish | Lesson publicly accessible |
| TD-23 | View path stats | Navigate to paths | Path completion stats shown |

### 18.5 Academy Administration

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| AD-01 | View admin dashboard | Login as admin → Dashboard loads | Stats: students, teachers, courses, enrollments |
| AD-02 | Create course | Click "New Course" → Fill → Assign teacher → Save | Course created with assigned teacher |
| AD-03 | Edit course status | Change status to "Published" | Course visible to students |
| AD-04 | Archive course | Change status to "Archived" | Course hidden from browse |
| AD-05 | Add category | Navigate to categories → Add | Category created |
| AD-06 | Edit category | Select category → Edit → Save | Category updated |
| AD-07 | Delete category | Select category → Delete | Category removed |
| AD-08 | View teachers | Navigate to teachers | Teacher list with stats |
| AD-09 | Approve teacher application | View application → Accept | Teacher role assigned |
| AD-10 | Reject teacher application | View application → Reject with reason | Applicant notified |
| AD-11 | View students | Navigate to students | Student list with stats |
| AD-12 | Create learning path | Navigate to paths → Create | Path created with stages |
| AD-13 | Edit path stages | Select path → Edit stages | Stages updated |
| AD-14 | Assign fiqh officer | Select path → Assign officer | Officer assigned |
| AD-15 | Change access control | Toggle `has_academy_access` for user | Access updated, logged |
| AD-16 | View access log | Navigate to access control → View log | "Who changed what when" shown |
| AD-17 | Send invitation | Navigate to invitations → Create | Invitation sent and tracked |
| AD-18 | Create competition | Navigate to competitions → Create | Competition created |
| AD-19 | Configure competition participants | Edit competition → Set participants | Participants configured |
| AD-20 | Set competition scope | Set scope to "halaqah" | Competition scoped correctly |
| AD-21 | View leaderboard admin | Navigate to leaderboard | Rankings + point history |
| AD-22 | Create badge | Navigate to badges → Create | Badge created |
| AD-23 | Upload badge image | Create badge → Upload image | Image saved |
| AD-24 | Edit badge requirements | Select badge → Edit criteria | Requirements updated |
| AD-25 | Manual badge award | Select student → Award badge | Badge awarded, points added |
| AD-26 | Moderate forum | Navigate to forum → Delete reply | Reply removed, user logged |
| AD-27 | Review fiqh | Navigate to fiqh → Review question | Question visible with answer |
| AD-28 | Assign fiqh supervisor | Select question → Assign supervisor | Supervisor assigned |
| AD-29 | Publish announcement | Navigate to announcements → Create → Publish | Announcement visible to targeted roles |
| AD-30 | Target announcement | Select target roles | Only targeted roles see it |
| AD-31 | Export report | Navigate to reports → Export CSV/PDF | File downloaded with correct data |
| AD-32 | View analytics | Navigate to analytics | Charts render with real data |
| AD-33 | Create halaqah | Navigate to halaqat → Create | Halaqah created with teacher |
| AD-34 | Manage halaqah students | Select halaqah → Add/remove students | Students updated |
| AD-35 | Save settings | Navigate to settings → Edit → Save | Settings saved, toast shown |
| AD-36 | Test SMTP | Settings → Notifications → Test Email | Test email sent, success shown |
| AD-37 | Update point values | Settings → Gamification → Edit points | Points updated |
| AD-38 | Update level thresholds | Settings → Gamification → Edit levels | Levels updated |
| AD-39 | Toggle gamification | Settings → Toggle points system OFF | Points system disabled |
| AD-40 | Toggle badges | Settings → Toggle badges OFF | Badges system disabled |
| AD-41 | Toggle leaderboard | Settings → Toggle leaderboard OFF | Leaderboard hidden |
| AD-42 | Toggle streak | Settings → Toggle streak OFF | Streak tracking disabled |
| AD-43 | Toggle forum | Settings → Forum → Disable | Forum inaccessible |
| AD-44 | Toggle fiqh | Settings → Fiqh → Disable | Fiqh page inaccessible |
| AD-45 | Enable maintenance mode | Settings → Maintenance → Toggle ON | Platform blocked for non-admins |
| AD-46 | Clear cache | Settings → Maintenance → Clear Cache | Cache cleared, confirmation shown |
| AD-47 | Backup | Settings → Maintenance → Backup | JSON file downloaded |
| AD-48 | Assign supervisor | Navigate to supervisors → Assign | Supervisor assigned to section |
| AD-49 | View archive | Navigate to archive | Archived items listed |
| AD-50 | View conversations | Navigate to conversations | All conversations listed |
| AD-51 | View users | Navigate to users | User list with roles |
| AD-52 | Manage library | Navigate to library | Books listed, add/edit/delete works |
| AD-53 | Manage series | Navigate to series | Series listed, add/edit/delete works |
| AD-54 | Manage public lessons | Navigate to public lessons | Lessons listed, publish/unpublish works |
| AD-55 | View certificates | Navigate to certificates | Certificate list shown |
| AD-56 | Video settings | Navigate to video settings | Settings saved correctly |
| AD-57 | Contact messages | Navigate to contact messages | Messages listed |

### 18.6 Parent Portal

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| PP-01 | View parent dashboard | Login as parent → Dashboard loads | Performance summary for linked children |
| PP-02 | Link child | Enter child email → Select relationship → Submit | Link request sent |
| PP-03 | Link with invalid email | Enter non-existent email → Submit | Error: "Child not found" |
| PP-04 | Link already linked child | Enter already linked child's email | Error: "Already linked" |
| PP-05 | View children | Navigate to children | All linked children with active courses |
| PP-06 | View child progress | Click child → View progress | Charts, badges, level, attendance |
| PP-07 | Generate report | Select child + time period → Generate | Report with attendance, tasks, grades |
| PP-08 | Export report PDF | Click "Export PDF" | PDF downloaded |
| PP-09 | Compare children | Select multiple children | Comparison data shown |
| PP-10 | Set restrictions | Navigate to restrictions → Select surahs/paths | Restrictions saved |
| PP-11 | Restrictions hidden from child | Parent sets restriction | Child's interface hides restricted items |
| PP-12 | Remove restriction | Delete restriction | Items visible to child again |
| PP-13 | Send message to teacher | Navigate to messages → Select teacher → Send | Message delivered |
| PP-14 | View notifications | Navigate to notifications | Child performance alerts shown |
| PP-15 | Unlink child | Navigate to children → Remove link | Link removed, data access lost |
| PP-16 | View calendar | Navigate to calendar | Children's schedule displayed |
| PP-17 | View teachers | Navigate to teachers | Children's linked teachers listed |

### 18.7 Supervisor & Reviewer Workflows

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| SV-01 | Content supervisor - view pending | Login as content supervisor → Dashboard | Pending lessons listed by status |
| SV-02 | Accept lesson | Select lesson → Accept | Lesson published, teacher notified |
| SV-03 | Reject lesson with reason | Select lesson → Reject → Write reason | Lesson rejected, teacher notified with reason |
| SV-04 | Content supervisor - manage courses | Navigate to courses | Courses listed, edit works |
| SV-05 | Content supervisor - manage paths | Navigate to paths | Paths listed, edit works |
| SV-06 | Content supervisor - manage series | Navigate to series | Series listed, edit works |
| SV-07 | Content supervisor - messages | Navigate to messages | Messages listed |
| SV-08 | Fiqh supervisor - view questions | Login as fiqh supervisor → Dashboard | Questions by status (new/under review/answered/rejected) |
| SV-09 | Fiqh supervisor - answer question | Select question → Write answer (rich text) → Publish | Answer published, questioner notified |
| SV-10 | Fiqh supervisor - reject question | Select question → Reject with reason | Questioner notified with reason |
| SV-11 | Fiqh supervisor - messages | Navigate to messages | Messages listed |
| SV-12 | Quality supervisor - view stats | Login as quality supervisor → Dashboard | Teacher grades, evaluation time, complaints |
| SV-13 | Quality supervisor - write report | Navigate to report → Write → Send to admin | Report saved, admin notified |
| SV-14 | General supervisor - view content | Login as supervisor → Navigate to content | Content review page |
| SV-15 | General supervisor - forum moderation | Navigate to forum → Hide/delete reply | Reply removed, user logged |
| SV-16 | General supervisor - track teachers | Navigate to teachers | Teacher performance shown |
| SV-17 | Fiqh officer - view assigned | Login as officer → Navigate to fiqh | Assigned questions listed |

### 18.8 Gamification & Performance Tracking

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| GP-01 | Award points - recitation | Submit recitation | +10 points added |
| GP-02 | Award points - mastered | Teacher accepts as "mastered" | +30 points added |
| GP-03 | Award points - task | Complete task | +15 points added |
| GP-04 | Award points - attendance | Attend lesson | +20 points added |
| GP-05 | Award points - streak | Submit daily recitation | +5 points added, streak incremented |
| GP-06 | Award points - juz complete | Complete full juz | +100 points added |
| GP-07 | Award points - session | Attend session | +20 points added |
| GP-08 | Award points - forum | Answer in forum | +25 points added |
| GP-09 | Award points - competition | Win competition | +500 points added |
| GP-10 | Streak multiplier - 3 days | Maintain 3-day streak | ×2.0 multiplier applied |
| GP-11 | Streak multiplier - 7 days | Maintain 7-day streak | ×2.0 multiplier applied |
| GP-12 | Streak multiplier - 30 days | Maintain 30-day streak | ×2.0 multiplier applied |
| GP-13 | Streak reset | Miss a day | Streak resets to 0 |
| GP-14 | Level promotion | Points reach 500 | Level changes to "Intermediate", notification sent |
| GP-15 | Level promotion - advanced | Points reach 2000 | Level changes to "Advanced" |
| GP-16 | Level promotion - hafiz | Points reach 5000 | Level changes to "Hafiz" |
| GP-17 | Level promotion - master | Points reach 10000 | Level changes to "Master" |
| GP-18 | Badge - first recitation | Submit first recitation | Badge awarded, +20 points |
| GP-19 | Badge - week streak | 7 consecutive days | Badge awarded, +70 points |
| GP-20 | Badge - juz amma hafiz | Complete Juz 30 | Badge awarded, +200 points |
| GP-21 | Badge - hundred recitations | 100 recitations | Badge awarded, +150 points |
| GP-22 | Badge - tajweed master | Complete Tajweed path | Badge awarded, +300 points |
| GP-23 | Badge - ramadan | Ramadan activity | Badge awarded, +250 points |
| GP-24 | Badge - full Quran | Complete Quran | Badge awarded, +1000 points |
| GP-25 | Badge - star of halaqah | Best in halaqah | Badge awarded, +180 points |
| GP-26 | Badge progress tracking | Check badge progress | Correct progress shown (e.g., 67/100) |
| GP-27 | Points log | View points history | All point entries with reasons shown |
| GP-28 | Leaderboard ranking | View leaderboard | Correct ranking by points |
| GP-29 | Leaderboard filter - halaqah | Filter by halaqah | Only halaqah members shown |
| GP-30 | Leaderboard filter - platform | Filter by platform | All users ranked |
| GP-31 | Points - admin adjust | Admin manually adjusts points | Points updated, logged |
| GP-32 | Disable points system | Admin toggles OFF | Points not awarded |
| GP-33 | Disable badges | Admin toggles OFF | Badges not awarded |
| GP-34 | Disable leaderboard | Admin toggles OFF | Leaderboard hidden |
| GP-35 | Disable streak | Admin toggles OFF | Streak not tracked |

### 18.9 Live Sessions & Video Calls

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| LV-01 | Start LiveKit session | Teacher clicks "Start Live" | LiveKit session created |
| LV-02 | Start Zoom session | Teacher selects Zoom → Add link | Zoom link shared with students |
| LV-03 | Start Meet session | Teacher selects Meet → Add link | Meet link shared with students |
| LV-04 | Student joins session | Student clicks join link | Enters waiting room or directly |
| LV-05 | Waiting room | Student joins → Waits | Waiting room displayed until teacher admits |
| LV-06 | Teacher admits student | Teacher admits from waiting room | Student joins session |
| LV-07 | Session auto-end | Session time expires | Session ends, link expires |
| LV-08 | Session reminder - 1 hour | 1 hour before session | Reminder notification sent |
| LV-09 | Session reminder - 10 min | 10 minutes before session | Reminder notification sent |
| LV-10 | Send session to individual | Teacher sends to one student | Only that student receives link |
| LV-11 | Send session to group | Teacher sends to group | All group members receive link |
| LV-12 | View recordings | Navigate to recordings | Past recordings listed |
| LV-13 | Track attendance | Session ends | Attendance recorded in `session_attendance` |
| LV-14 | Session link expiry | After session ends | Link no longer works |

### 18.10 Notifications, Messaging & Community Alerts

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| NM-01 | In-app notification | Event occurs | Bell icon updates, notification appears |
| NM-02 | Email notification | Event occurs | Email sent via SMTP |
| NM-03 | Notification - enrollment accept | Teacher accepts enrollment | Student receives notification |
| NM-04 | Notification - enrollment reject | Teacher rejects enrollment | Student receives notification with reason |
| NM-05 | Notification - new task | Teacher creates task | Student receives notification |
| NM-06 | Notification - task graded | Teacher grades submission | Student receives notification |
| NM-07 | Notification - session link | Teacher creates session | Student receives link |
| NM-08 | Notification - session reminder 1h | 1 hour before session | Reminder sent |
| NM-09 | Notification - session reminder 10m | 10 minutes before session | Reminder sent |
| NM-10 | Notification - forum reply | Someone replies to topic | Topic creator notified |
| NM-11 | Notification - level up | Points reach next level | Level promotion notification |
| NM-12 | Notification - new badge | Badge earned | Badge notification |
| NM-13 | Notification - streak warning | End of day, no recitation | Streak warning sent |
| NM-14 | Notification - parent link request | Parent sends link request | Child + parent notified |
| NM-15 | Notification - fiqh answer | Fiqh question answered | Questioner notified |
| NM-16 | Notification - fiqh rejected | Fiqh question rejected | Questioner notified with reason |
| NM-17 | Notification - parent weekly report | Weekly cron runs | Parent receives report |
| NM-18 | Notification - daily werd | Daily cron runs | Student receives werd reminder |
| NM-19 | Search notifications | Type in search | Filtered notifications shown |
| NM-20 | Filter unread | Click "Unread" | Only unread notifications shown |
| NM-21 | Mark all as read | Click "Mark all read" | All marked as read |
| NM-22 | Send message | Select conversation → Type → Send | Message delivered |

### 18.11 Competitions

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| CP-01 | View open competitions | Navigate to competitions | Open competitions listed |
| CP-02 | Submit to competition | Select competition → Submit recitation | Submission recorded |
| CP-03 | Create competition (admin) | Navigate to competitions → Create | Competition created |
| CP-04 | Edit competition | Select competition → Edit | Competition updated |
| CP-05 | Configure participants | Edit competition → Set participants | Participants configured |
| CP-06 | Set competition scope | Set to "halaqah" | Scoped correctly |
| CP-07 | View competition results | After competition ends | Results displayed |
| CP-08 | Award competition winner | Select winner | Badge awarded, points multiplied |
| CP-09 | Competition rank system | View rankings | Ranks (1st, 2nd, 3rd) with points |
| CP-10 | Competition judges | Assign judges | Judges can evaluate submissions |

### 18.12 Academy Content Discovery

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| CD-01 | View series page | Navigate to series | Available series listed |
| CD-02 | Open series detail | Click series | Episodes/lessons listed |
| CD-03 | View lesson in series | Click lesson | Lesson content displayed |
| CD-04 | Open public lesson | Navigate to public lesson | Lesson content publicly accessible |
| CD-05 | Public lesson - no auth | Access public lesson without login | Lesson accessible (no auth required) |
| CD-06 | Public lesson - tracking | View public lesson | View tracked (if implemented) |

### 18.13 Fiqh Q&A Workflow

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| FQ-01 | Submit fiqh question | Fill form → Submit | Question created, status "pending" |
| FQ-02 | Submit with custom fields | Fill custom fields → Submit | Custom data saved |
| FQ-03 | View my questions | Navigate to "My Questions" | Questions listed with status |
| FQ-04 | View answered question | Click answered question | Question + full answer displayed |
| FQ-05 | Fiqh supervisor - review | Login as supervisor → View questions | Questions by status |
| FQ-06 | Fiqh supervisor - answer | Select question → Write answer (rich text) → Publish | Answer published |
| FQ-07 | Fiqh supervisor - reject | Select question → Reject with reason | Questioner notified |
| FQ-08 | Fiqh officer - view assigned | Login as officer → View assigned | Only assigned questions shown |
| FQ-09 | Admin - assign supervisor | Select question → Assign fiqh supervisor | Supervisor assigned |
| FQ-10 | Admin - review all | Navigate to fiqh admin | All questions and answers visible |
| FQ-11 | Fiqh categories | Navigate to categories | Categories listed |
| FQ-12 | Fiqh - close question | Mark question as closed | Status changes to "closed" |

### 18.14 Forum Moderation

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| FM-01 | Supervisor - view all topics | Login as supervisor → Forum | All topics and replies visible |
| FM-02 | Supervisor - hide reply | Select reply → Hide | Reply hidden from public view |
| FM-03 | Supervisor - delete reply | Select reply → Delete | Reply permanently removed |
| FM-04 | Supervisor - view violations | Navigate to violations | Violation log per user |
| FM-05 | Admin - create forum | Navigate to forum → Create forum | Forum created |
| FM-06 | Admin - manage forums | Edit/delete forums | Forums updated/removed |
| FM-07 | Student - create topic | Fill form → Submit | Topic published (if approval required, goes to pending) |
| FM-08 | Topic approval workflow | Student creates topic → Supervisor approves | Topic published after approval |
| FM-09 | Blocked word filter | Student types blocked word | Word filtered/blocked |

### 18.15 Certificate Generation

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| CG-01 | Auto-issue on completion | Student completes course | Certificate auto-generated |
| CG-02 | Download PDF | Navigate to certificates → Download | PDF with correct data + logo |
| CG-03 | Admin - manage certificates | Navigate to certificates | All certificates listed |
| CG-04 | Admin - issue manual | Select student → Issue certificate | Certificate created |
| CG-05 | Certificate data | View certificate | Student name, course, date, issue number correct |

### 18.16 Cron Jobs

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| CJ-01 | Session reminders | Cron runs hourly | Upcoming sessions get reminders |
| CJ-02 | Task reminders | Cron runs daily morning | Pending tasks get reminders |
| CJ-03 | Overdue task alerts | Cron detects overdue tasks | Alert sent to student + parent |
| CJ-04 | Streak reminders | Cron runs daily evening | Students without recitation warned |
| CJ-05 | Parent weekly reports | Cron runs weekly | Reports generated and emailed |
| CJ-06 | Admin activity reports | Cron runs weekly/monthly | Reports generated |
| CJ-07 | Academy reminders | Cron runs daily | General reminders sent |
| CJ-08 | Check expirations | Cron runs daily | Expired items handled |
| CJ-09 | Auto-end sessions | Cron runs every 5 min | Past sessions marked as ended |
| CJ-10 | Daily werd reminders | Cron runs daily | Werd reminders sent |

### 18.17 Mode Switcher

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| MS-01 | Switch to Reader | Click mode switcher → Select Reader | `/reader` loads, fade+slide animation |
| MS-02 | Switch to Academy | Click mode switcher → Select Academy | `/academy/student` loads |
| MS-03 | Hidden for academy-only | Login as academy-only user | Mode switcher not visible |
| MS-04 | Visible for dual account | Login as academy+reader user | Mode switcher visible |
| MS-05 | Preserve state | Switch mode → Switch back | Previous state preserved |

### 18.18 Dark Mode

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| DM-01 | Toggle dark mode | Click theme toggle | Dark mode applied |
| DM-02 | Dark mode - all pages | Navigate all academy pages | No unreadable text/elements |
| DM-03 | Dark mode - forms | Fill forms in dark mode | All inputs readable |
| DM-04 | Dark mode - charts | View charts in dark mode | Charts readable with correct colors |
| DM-05 | Dark mode - persistence | Toggle dark → Reload | Preference persisted |

### 18.19 Responsive Design

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| RD-01 | Mobile - dashboard | Open on mobile | Dashboard responsive, all elements visible |
| RD-02 | Mobile - calendar | Open calendar on mobile | Switches to list view |
| RD-03 | Mobile - chat | Open chat on mobile | Chat usable, keyboard doesn't hide input |
| RD-04 | Mobile - video player | Play video on mobile | Video player responsive |
| RD-05 | Mobile - task submission | Submit task on mobile | Upload works, form usable |
| RD-06 | Mobile - forms | Fill any form on mobile | All inputs accessible, keyboard works |
| RD-07 | Mobile - tables | View tables on mobile | Horizontal scroll or card layout |
| RD-08 | Tablet - layout | Open on tablet | Layout adapts correctly |
| RD-09 | Desktop - sidebar | Open on desktop | Sidebar visible and functional |
| RD-10 | Mode Switcher - mobile | Use mode switcher on mobile | Works correctly |

### 18.20 Error Handling

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| EH-01 | Network failure | Disconnect network → Make request | Error message shown, no crash |
| EH-02 | API timeout | Server takes > 30s | Timeout error shown |
| EH-03 | Invalid form input | Submit form with invalid data | Validation errors shown |
| EH-04 | 404 - invalid route | Navigate to `/academy/invalid` | 404 page shown |
| EH-05 | 403 - forbidden | Access restricted page | 403 page or redirect |
| EH-06 | Session expired | Use expired JWT | Redirect to login |
| EH-07 | Concurrent edits | Two users edit same data | Last write wins or conflict shown |
| EH-08 | Large file upload | Upload file > limit | Error: "File too large" |
| EH-09 | Invalid file type | Upload unsupported file type | Error: "Invalid file type" |
| EH-10 | Empty required fields | Submit form with empty required fields | Validation errors shown |
| EH-11 | SQL injection attempt | Enter `' OR 1=1 --` in input | Input sanitized, no breach |
| EH-12 | XSS attempt | Enter `<script>alert('xss')</script>` | Script not executed, escaped |
| EH-13 | Browser back button | Navigate forward → Click back | Correct state restored |
| EH-14 | Double submit | Click submit button twice rapidly | Only one submission processed |

### 18.21 Performance Testing

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| PF-01 | Dashboard load time | Measure dashboard load | < 3 seconds |
| PF-02 | Course list load | Measure course list load | < 3 seconds |
| PF-03 | Lesson page load | Measure lesson page load | < 3 seconds |
| PF-04 | API response time | Measure API endpoints | < 1 second average |
| PF-05 | Image loading | Load pages with images | Images optimized, lazy loaded |
| PF-06 | Chart rendering | Load analytics page | Charts render smoothly |
| PF-07 | Concurrent users | Simulate 100 concurrent users | No crashes, reasonable response times |
| PF-08 | Memory leak check | Use app for 30 minutes | No memory leaks |
| PF-09 | Duplicate API calls | Monitor network tab | No duplicate requests |
| PF-10 | SWR caching | Navigate away → Back | Cached data shown instantly |

### 18.22 Security Testing

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| ST-01 | RBAC - teacher to admin | Teacher navigates to `/academy/admin` | Blocked |
| ST-02 | RBAC - student to admin | Student navigates to `/academy/admin` | Blocked |
| ST-03 | RBAC - parent unauthorized | Parent accesses unrelated child | Blocked |
| ST-04 | JWT manipulation | Modify JWT payload | Token rejected |
| ST-05 | SQL injection | Enter SQL in forms | Input sanitized |
| ST-06 | XSS in forum | Post script tag in forum | Script not executed |
| ST-07 | File upload security | Upload `.exe` or `.php` file | File rejected |
| ST-08 | Unauthorized API access | Call API without auth | 401 returned |
| ST-09 | IDOR - access other user data | Modify ID in API request | Access denied |
| ST-10 | Rate limiting | Send 1000 requests/min | Rate limited (when implemented) |

### 18.24 File Upload & Download

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| FU-01 | Upload video | Teacher uploads MP4 | Video uploaded, processed |
| FU-02 | Upload PDF | Teacher uploads PDF | PDF uploaded, accessible |
| FU-03 | Upload audio | Student uploads MP3 | Audio uploaded, playable |
| FU-04 | Upload image | User uploads avatar | Image uploaded, displayed |
| FU-05 | Upload large file | Upload 500MB video | Upload completes (or error if too large) |
| FU-06 | Upload invalid type | Upload `.exe` file | Rejected with error |
| FU-07 | Download PDF | Click download on certificate | PDF downloads correctly |
| FU-08 | Download audio | Click download on audio | Audio downloads correctly |
| FU-09 | S3 storage | Files stored in S3 | Files accessible via S3 URL |
| FU-10 | Cloudinary storage | Files stored in Cloudinary | Files accessible via Cloudinary URL |

---

*This document was created based on a comprehensive analysis of the project codebase.*
*Last Updated: June 21, 2026*
