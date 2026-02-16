# **Job Board System - Database Design**

## **Overview**

Job Board database consists of **5 core entities** that work together to manage users, job listings, applications, and reviews. Here's the complete design:

---

## **Core Entities & Their Relationships**

### **1. USER Table**
**Purpose:** Authentication and role management  
**Stores:** Login credentials, account status, user roles

**Fields:**
- `id` (Primary Key)
- `email` (Unique, required) - Login identifier
- `password_hash` (required) - Encrypted password
- `first_name` (required)
- `last_name` (required)
- `role` (Enum: "Job Seeker" OR "Recruiter") - Determines access level
- `is_active` (Boolean, default: False) - **Email verified status**
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships:**
- Links to **UserProfile** (1:1) - Every user has one profile
- Links to **Job** (1:∞) - Recruiters can post many jobs
- Links to **Application** (1:∞) - Job Seekers can submit many applications
- Links to **Review** (1:∞) - Can both write and receive reviews

**Why:** Two-role system enables different user types (employers post jobs, job seekers apply)

---

### **2. USER PROFILE Table**
**Purpose:** Extended user information and file storage  
**Stores:** Contact details, bio, resume, avatar, company info

**Fields:**
- `id` (Primary Key)
- `user_id` (Foreign Key → User, Unique) - Links to parent user
- `phone_number` (optional)
- `bio` (optional, Text) - Professional summary
- `avatar` (optional, File URL) - Profile picture (cloud storage)
- `resume` (optional, File URL) - For Job Seekers only
- `skills` (optional, Text) - Comma-separated
- `experience_years` (optional, Integer, default: 0)
- `company_name` (optional, for Recruiters)
- `company_website` (optional, for Recruiters)
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships:**
- Belongs to **User** (1:1) - Every profile has exactly one user

**Why:** Separates core user data from extended profile info for flexibility

---

### **3. JOB Table**
**Purpose:** Job listing management  
**Stores:** Job details posted by recruiters

**Fields:**
- `id` (Primary Key)
- `recruiter_id` (Foreign Key → User, required) - Who posted this job
- `category` (Enum) - Job industry
- `title` (String, required) - Job position title
- `description` (Text, required) - Full job details
- `requirements` (Text, required) - Skills/qualifications needed
- `location` (String, required) - Job location
- `job_type` (Enum: Full-time, Part-time, Remote, Contract, Internship)
- `salary_min` (Integer, optional)
- `salary_max` (Integer, optional)
- `experience_required` (Integer, default: 0) - Years needed
- `position_count` (Integer, default: 1) - Openings available
- `company_name` (String, required)
- `is_active` (Boolean, default: True) - Job visibility
- `application_deadline` (DateTime, optional)
- `created_at` (DateTime, auto)
- `updated_at` (DateTime, auto)

**Relationships:**
- Belongs to **User** (recruiter) - Many:1 
- Links to **Application** (1:∞) - One job has many applications
- Links to **Review** (1:∞) - One job can have many reviews

**Business Rules:**
- Recruiter can only edit/delete their own jobs
- Salary constraint: `salary_min ≤ salary_max` (if both provided)
- Deadline should be in the future

**Why:** Central entity for all job-related operations

---

### **4. APPLICATION Table**
**Purpose:** Track job applications throughout their lifecycle  
**Stores:** Application data, resume, status, timestamps

**Fields:**
- `id` (Primary Key)
- `job_id` (Foreign Key → Job, required)
- `applicant_id` (Foreign Key → User, required) - Job Seeker applying
- `resume` (File URL, required) - Uploaded resume
- `cover_letter` (Text, optional) - Application message
- `status` (Enum, default: "Pending") - Current status
- `applied_at` (DateTime, auto) - Application submission time
- `updated_at` (DateTime, auto) - Last status update time

**Status Lifecycle:**
- `Pending` → Initial state after submission
- `Reviewed` → Recruiter has reviewed
- `Accepted` → Selected for next stage
- `Rejected` → Not selected

**Unique Constraint:** (job_id, applicant_id) - **One application per job per seeker**

**Relationships:**
- Belongs to **Job** - Many:1
- Belongs to **User** (applicant) - Many:1

**Email Triggers:**
- When created → Send confirmation to applicant + notification to recruiter
- When status changes → Notify applicant

**Business Rules:**
- Cannot apply to same job twice
- Applicant must have role = "Job Seeker"
- Applicant cannot be the recruiter (self-application prevented)

**Why:** Tracks complete application journey with resume management

---

### **5. REVIEW Table**
**Purpose:** Quality feedback for recruiters  
**Stores:** Ratings and comments from job seekers

**Fields:**
- `id` (Primary Key)
- `job_id` (Foreign Key → Job, required) - Context of review
- `recruiter_id` (Foreign Key → User, required) - Being reviewed
- `reviewer_id` (Foreign Key → User, required) - Job Seeker writing review
- `rating` (Integer, 1-5, required) - Star rating
- `comment` (Text, optional, max 1000 chars)
- `created_at` (DateTime, auto)

**Unique Constraint:** (job_id, reviewer_id) - **One review per applicant per job**

**Relationships:**
- Belongs to **Job** - Many:1
- Belongs to **User** (recruiter receiving review) - Many:1
- Belongs to **User** (reviewer writing review) - Many:1

**Business Rules:**
- Only Job Seekers can write reviews
- Only for jobs they applied to
- Cannot review yourself
- Cannot delete reviews (audit trail)
- Rating must be 1-5

**Why:** Maintains recruiter quality and helps other job seekers make informed decisions

---