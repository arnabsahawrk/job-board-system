# Jobly - Database Design Documentation

## Overview

The Job Board System (Jobly) uses a relational database with **7 core entities** organized into 3 logical domains: Authentication, Job Management, and Application Tracking. The database is designed following **3rd Normal Form (3NF)** principles.

---

## Core Entities & Relationships

### **Domain 1: Authentication & User Management**

#### **1. User Model**
**Purpose:** Core authentication and role management  
**Storage:** User credentials, account status, role-based access control

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | UUID | Primary Key | Unique user identifier |
| `email` | Email | Unique, Required | Login credential (normalized) |
| `password` | String | Hashed | Encrypted password |
| `full_name` | String (150) | Required | User's full name |
| `role` | Enum | Required | Either "seeker" or "recruiter" |
| `is_active` | Boolean | Default: True | Account status |
| `is_verified` | Boolean | Default: False | Email verification status |
| `is_staff` | Boolean | Default: False | Admin panel access |
| `is_superuser` | Boolean | Default: False | Super-admin rights |
| `created_at` | DateTime | Auto | Account creation timestamp |
| `updated_at` | DateTime | Auto | Last modification timestamp |

**Key Constraints:**
- Email is unique and serves as USERNAME_FIELD for authentication
- Role determines feature access (recruiters post jobs, seekers apply)
- Must be verified before login (is_verified = True)

**Relationships:**
- **One-to-One** with UserProfile (every user has exactly one profile)
- **One-to-Many** with Job (recruiters post multiple jobs)
- **One-to-Many** with Application (seekers apply to multiple jobs)
- **One-to-Many** with Review (can both write and receive reviews)
- **One-to-Many** with ApplicationFeedback (recruiters provide feedback)
- **One-to-Many** with ReviewHelpful (users can mark reviews as helpful)

---

#### **2. EmailVerification Model**
**Purpose:** Manage email verification tokens and status  
**Storage:** Verification tokens with expiry tracking

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Internal identifier |
| `user_id` | Foreign Key | Unique, Required | Links to User (1:1) |
| `token` | String (255) | Unique, Required | UUID-based verification token |
| `is_verified` | Boolean | Default: False | Verification completion status |
| `created_at` | DateTime | Auto | Token creation time |
| `verified_at` | DateTime | Nullable | When email was verified |

**Workflow:**
1. User registers → token generated and stored
2. User clicks verification link → token validated
3. is_verified set to True → user can login
4. Token expires after 24 hours (handled in application logic)

**Relationships:**
- **One-to-One** with User (each user has one verification record)

---

#### **3. UserProfile Model**
**Purpose:** Extended user information and professional details  
**Storage:** Contact info, bio, media files, professional experience

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Internal identifier |
| `user_id` | Foreign Key | Unique, Required | Links to User (1:1) |
| `phone_number` | String (15) | Nullable | Contact phone |
| `bio` | Text | Nullable | Professional summary (max 1000) |
| `avatar` | CloudinaryField | Nullable | Profile picture (cloud URL) |
| `skills` | Text | Nullable | Comma-separated skill list |
| `experience` | Date | Nullable | Professional start date |
| `resume` | CloudinaryField | Nullable | Resume document (cloud URL) |
| `created_at` | DateTime | Auto | Profile creation |
| `updated_at` | DateTime | Auto | Last update |

**File Storage:**
- Uses Cloudinary for cloud storage
- avatar: JPG, PNG, GIF (max 1MB)
- resume: PDF, DOC, DOCX (max 5MB)
- Stored in cloud folders: `profiles/avatars/` and `profiles/resumes/`

**Relationships:**
- **One-to-One** with User (extends user data)

---

### **Domain 2: Job Management**

#### **4. Job Model**
**Purpose:** Job listings posted by recruiters  
**Storage:** Complete job information, requirements, and metadata

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Unique job identifier |
| `recruiter_id` | Foreign Key | Required | Links to User (recruiter) |
| `category` | Enum | Required | Job industry (it, healthcare, finance, education, marketing, design, other) |
| `title` | String (255) | Required | Job position title |
| `description` | Text | Required | Detailed job description |
| `requirements` | Text | Required | Required skills/qualifications |
| `location` | String (255) | Required | Job location |
| `job_type` | Enum | Required | full_time, part_time, remote, contract, internship |
| `salary` | Integer | Nullable | Annual salary in currency units |
| `experience_required` | Integer | Default: 0 | Years of experience needed |
| `position_count` | Integer | Default: 1 | Number of open positions |
| `company_name` | String (255) | Required | Hiring company name |
| `company_logo` | CloudinaryField | Nullable | Company logo (cloud URL) |
| `application_deadline` | DateTime | Nullable | Last date to apply |
| `created_at` | DateTime | Auto | Job posting date |
| `updated_at` | DateTime | Auto | Last modification date |

**File Storage:**
- Uses Cloudinary for company logos
- Stored in: `jobs/company_logos/`
- Accepts: JPG, PNG, JPEG (max 1MB)

**Validation Rules:**
- salary > 0 (if provided)
- experience_required ≥ 0
- position_count ≥ 1
- application_deadline in future (if set)

**Relationships:**
- **Many-to-One** with User (recruiter who posted it)
- **One-to-Many** with Application (receives multiple applications)
- **One-to-Many** with Review (can receive reviews)

---

### **Domain 3: Application & Feedback Management**

#### **5. Application Model**
**Purpose:** Track job applications from seekers to jobs  
**Storage:** Application status, resume, cover letter, timestamps

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Unique application identifier |
| `job_id` | Foreign Key | Required | Links to Job |
| `applicant_id` | Foreign Key | Required | Links to User (job seeker) |
| `resume` | CloudinaryField | Nullable | Application resume (cloud URL) |
| `cover_letter` | Text | Nullable | Application message |
| `status` | Enum | Default: pending | pending, reviewed, accepted, rejected |
| `applied_at` | DateTime | Auto | Application submission time |
| `updated_at` | DateTime | Auto | Status update time |

**Unique Constraint:**
- **(job_id, applicant_id)** - Prevents duplicate applications to same job

**Status Lifecycle:**
```
pending → reviewed → accepted
                  ↘ rejected
```

**File Storage:**
- Resume can be uploaded with application
- Uses Cloudinary for storage
- Stored in: `applications/resumes/`
- Accepts: PDF, DOC, DOCX (max 1MB)

**Email Triggers:**
- **On Create:** Confirmation to applicant + notification to recruiter
- **On Status Change:** Update email to applicant with feedback

**Relationships:**
- **Many-to-One** with Job
- **Many-to-One** with User (applicant/seeker)
- **One-to-One** with ApplicationFeedback (optional)

---

#### **6. ApplicationFeedback Model**
**Purpose:** Recruiter feedback when updating application status  
**Storage:** Rejection reasons, feedback, and status change history

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Unique feedback identifier |
| `application_id` | Foreign Key | Unique, Required | Links to Application (1:1) |
| `recruiter_id` | Foreign Key | Required | Recruiter providing feedback |
| `feedback_text` | Text | Required, max 1000 | Feedback message |
| `status_given` | String (20) | Required | Status when feedback given |
| `created_at` | DateTime | Auto | Feedback creation time |
| `updated_at` | DateTime | Auto | Last modification time |

**Purpose:**
- Provides context for status changes
- Especially useful for rejections (explain why declined)
- Helps job seekers understand decisions

**Relationships:**
- **One-to-One** with Application (each app can have one feedback)
- **Many-to-One** with User (recruiter providing feedback)

---

#### **7. Review Model**
**Purpose:** Job seeker reviews of recruiters  
**Storage:** Ratings and feedback about hiring experience

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Unique review identifier |
| `job_id` | Foreign Key | Required | Job context of review |
| `recruiter_id` | Foreign Key | Required | Recruiter being reviewed |
| `reviewer_id` | Foreign Key | Required | Job seeker writing review |
| `rating` | Integer | 1-5 range | Star rating |
| `comment` | Text | Nullable, max 1000 | Review text |
| `created_at` | DateTime | Auto | Review creation time |

**Unique Constraint:**
- **(job_id, reviewer_id)** - One review per seeker per job

**Validation Rules:**
- rating must be 1-5 (inclusive)
- Only job seekers (role = 'seeker') can write reviews
- Must have applied to job first

**Email Triggers:**
- New review notification to recruiter

**Relationships:**
- **Many-to-One** with Job
- **Many-to-One** with User (recruiter receiving review)
- **Many-to-One** with User (reviewer/seeker writing review)
- **One-to-Many** with ReviewHelpful (receives helpful votes)

---

#### **8. ReviewHelpful Model**
**Purpose:** Track helpful votes on reviews  
**Storage:** User votes marking reviews as helpful

**Fields:**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `id` | Integer | Primary Key | Unique identifier |
| `review_id` | Foreign Key | Required | Links to Review |
| `user_id` | Foreign Key | Required | User voting |
| `created_at` | DateTime | Auto | Vote timestamp |

**Unique Constraint:**
- **(review_id, user_id)** - One vote per user per review

**Functionality:**
- Any authenticated user can mark reviews helpful
- Toggling removes the vote
- Helps surface helpful reviews

**Relationships:**
- **Many-to-One** with Review
- **Many-to-One** with User (voter)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Core Auth)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ id (UUID) | email (Unique) | password | full_name | role  │ │
│  │ is_verified | is_active | created_at | updated_at        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────┬─────────────────────────────────────────────────────────────┘
      │
      ├─ 1:1 ──→ USER_PROFILE (Extended Profile)
      │          ├─ phone_number, bio, avatar, skills
      │          └─ resume, experience, created_at
      │
      ├─ 1:1 ──→ EMAIL_VERIFICATION (Email Verification)
      │          ├─ token, is_verified, verified_at
      │          └─ created_at
      │
      ├─ 1:∞ ──→ JOB (Posted Jobs - if recruiter)
      │          ├─ category, title, description, requirements
      │          ├─ location, job_type, salary, experience_required
      │          ├─ position_count, company_name, company_logo
      │          ├─ application_deadline
      │          └─ created_at, updated_at
      │          │
      │          ├─ 1:∞ ──→ APPLICATION (Received Applications)
      │          │          ├─ resume, cover_letter, status
      │          │          ├─ applied_at, updated_at
      │          │          │
      │          │          └─ 1:1 → APPLICATION_FEEDBACK
      │          │                   ├─ feedback_text, status_given
      │          │                   └─ created_at, updated_at
      │          │
      │          └─ 1:∞ ──→ REVIEW (Received Reviews)
      │                     ├─ rating, comment
      │                     ├─ created_at
      │                     │
      │                     └─ 1:∞ → REVIEW_HELPFUL
      │                              ├─ user_id (voter)
      │                              └─ created_at
      │
      ├─ 1:∞ ──→ APPLICATION (Submitted Applications - if seeker)
      │          ├─ job_id, resume, cover_letter
      │          ├─ status, applied_at, updated_at
      │          │
      │          └─ 1:1 → APPLICATION_FEEDBACK
      │
      └─ 1:∞ ──→ REVIEW (Written Reviews - if seeker)
               ├─ job_id, recruiter_id, rating
               ├─ comment, created_at
               │
               └─ 1:∞ → REVIEW_HELPFUL (Votes on own reviews)
```

---

## Data Flow Patterns

### **User Registration & Verification Flow**
```
1. User submits registration form
   ↓ Creates: User record + UserProfile + EmailVerification
   ↓
2. Verification email sent with token
   ↓
3. User clicks verification link
   ↓ EmailVerification.is_verified = True
   ↓ User.is_verified = True
   ↓
4. User can now login
```

### **Job Posting & Application Flow**
```
1. Recruiter creates Job
   ↓ Stores: Job record with all details
   ↓
2. Job Seeker searches and views Job
   ↓
3. Seeker applies by creating Application
   ↓ Stores: Application with resume, cover_letter
   ↓ Sends: Email to applicant + notification to recruiter
   ↓
4. Recruiter reviews Application
   ↓
5. Recruiter updates Application status
   ↓ Status changes: pending → reviewed → accepted/rejected
   ↓ Creates: ApplicationFeedback with reason
   ↓ Sends: Update email to applicant
```

### **Review System Flow**
```
1. Job Seeker has applied to Job
   ↓
2. Seeker submits Review (optional)
   ↓ Creates: Review record with rating + comment
   ↓ Sends: Notification to recruiter
   ↓
3. Other users can mark Review as helpful
   ↓ Creates: ReviewHelpful record (toggleable)
   ↓
4. Reviews visible on recruiter profile
   ↓ Calculated stats: average rating, total reviews
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| **UUID for User ID** | Better privacy than sequential IDs |
| **Cloudinary Storage** | No persistent file storage on Vercel; scalable solution |
| **Email as USERNAME_FIELD** | More user-friendly than numeric IDs |
| **One Review Per Job Per Seeker** | Prevents review spam |
| **One App Per Job Per Seeker** | Prevents duplicate applications |
| **Soft Deletes on Reviews** | Maintains audit trail; no permanent deletion |
| **ApplicationFeedback Optional** | Feedback only created when status changes |
| **ReviewHelpful Votes** | Helps surface quality reviews |
| **Timestamp on Everything** | Enables audit logging and timeline tracking |

---

## Database Constraints Summary

### **Unique Constraints:**
- User.email (globally unique)
- UserProfile.user_id (1:1 mapping)
- EmailVerification.user_id (1:1 mapping)
- EmailVerification.token (unique tokens)
- Application(job_id, applicant_id) - Composite
- Review(job_id, reviewer_id) - Composite
- ReviewHelpful(review_id, user_id) - Composite

### **Foreign Key Constraints:**
- All foreign keys have ON_DELETE=CASCADE
- Deleting a User removes all related data
- Deleting a Job removes all applications & reviews

### **Not Null Constraints:**
- User: email, full_name, role, password
- Job: recruiter_id, title, description, requirements, location, job_type, company_name, category
- Application: job_id, applicant_id, status
- ApplicationFeedback: application_id, recruiter_id, feedback_text, status_given
- Review: job_id, recruiter_id, reviewer_id, rating

---

## Migration Path

When transitioning to production:

1. **Development:** SQLite for local testing
2. **Staging:** PostgreSQL to mirror production
3. **Production:** PostgreSQL with automated backups
4. **Cloud Files:** Cloudinary for avatars, resumes, logos

All configured through environment variables for flexibility.
