# Jobly - API Documentation

## API Overview

**Base URL:** `https://arnabsahawrk-jobly-backend.vercel.app/api/`  
**Swagger API Documentation:** `https://arnabsahawrk-jobly-backend.vercel.app/swagger/`  
**API Version:** v1  
**Documentation Format:** REST/JSON  
**Authentication:** JWT (JSON Web Token)  
**Pagination:** 10 items per page (configurable)

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Job Management Endpoints](#job-management-endpoints)
3. [Application Endpoints](#application-endpoints)
4. [Review Endpoints](#review-endpoints)
5. [HTTP Status Codes](#http-status-codes)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication Endpoints

Base Path: `/api/auth/`

### **1. Register New User**

| Attribute            | Value                  |
| -------------------- | ---------------------- |
| **Endpoint**         | `POST /auth/register/` |
| **Authentication**   | None (Public)          |
| **Role Restriction** | None                   |
| **Rate Limit**       | 5 requests/hour        |

**Request Body:**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "seeker", // or "recruiter"
  "password": "SecurePassword123"
}
```

**Validation Rules:**

- Email must be unique (not already registered)
- Password minimum 8 characters
- Role must be "seeker" or "recruiter"
- full_name required and max 150 characters

**Success Response (201 Created):**

```json
{
  "message": "Registration successful! Check your email to verify.",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com"
}
```

**Failure Responses:**

- `400 Bad Request` - Invalid email, password, or role
- `400 Bad Request` - Email already registered
- `400 Bad Request` - Password too weak

**Side Effects:**

- Creates User record
- Creates UserProfile (empty)
- Creates EmailVerification with token
- Sends verification email to inbox

**Email Content:**

- Verification link with token: `{frontend_url}/verify-email?token={token}`
- Token expires in 24 hours
- Can be resent via `/resend_verification/`

---

### **2. Verify Email Address**

| Attribute            | Value                      |
| -------------------- | -------------------------- |
| **Endpoint**         | `POST /auth/verify_email/` |
| **Authentication**   | None (Public)              |
| **Role Restriction** | None                       |

**Request Body:**

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Token Source:** From verification email link

**Success Response (200 OK):**

```json
{
  "message": "Email verified successfully!"
}
```

**Failure Responses:**

- `400 Bad Request` - Invalid token
- `400 Bad Request` - Expired token (> 24 hours)
- `400 Bad Request` - Token already used

**Side Effects:**

- Sets User.is_verified = True
- Sets EmailVerification.verified_at = now
- User can now login
- Sends account verified confirmation email

---

### **3. Resend Verification Email**

| Attribute            | Value                             |
| -------------------- | --------------------------------- |
| **Endpoint**         | `POST /auth/resend_verification/` |
| **Authentication**   | None (Public)                     |
| **Role Restriction** | None                              |

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Validation:**

- Email must exist in system
- User must not already be verified
- Rate limited: 2 requests/hour per email

**Success Response (200 OK):**

```json
{
  "message": "Verification email sent successfully!"
}
```

**Failure Responses:**

- `400 Bad Request` - Email not found
- `400 Bad Request` - Email already verified
- `429 Too Many Requests` - Rate limit exceeded

---

### **4. User Login**

| Attribute            | Value                   |
| -------------------- | ----------------------- |
| **Endpoint**         | `POST /auth/login/`     |
| **Authentication**   | None (Public)           |
| **Role Restriction** | None                    |
| **Rate Limit**       | 10 requests/hour per IP |

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Validation:**

- Email must exist
- Password must be correct
- User must be verified (is_verified = True)
- User must be active (is_active = True)

**Success Response (200 OK):**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "seeker",
    "is_verified": true,
    "is_active": true,
    "profile": {
      "phone_number": null,
      "bio": null,
      "avatar": null,
      "skills": null,
      "experience": null,
      "experience_years": 0,
      "resume": null
    },
    "created_at": "2026-02-21T10:00:00Z",
    "updated_at": "2026-02-21T10:00:00Z"
  }
}
```

**Token Details:**

- access_token: 24 hours expiry
- refresh_token: 30 days expiry
- Include in Authorization header: `Authorization: JWT {access_token}`

**Failure Responses:**

- `400 Bad Request` - Invalid email or password
- `400 Bad Request` - Email not verified yet
- `400 Bad Request` - Account is inactive

---

### **5. Refresh Access Token**

| Attribute          | Value                                    |
| ------------------ | ---------------------------------------- |
| **Endpoint**       | `POST /auth/refresh_token/`              |
| **Authentication** | None (Public)                            |
| **Purpose**        | Get new access token using refresh token |

**Request Body:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Failure Responses:**

- `401 Unauthorized` - Invalid refresh token
- `401 Unauthorized` - Expired refresh token

**Use Case:** When access token expires, use refresh token to get new one without re-login

---

### **6. Request Password Reset**

| Attribute            | Value                                |
| -------------------- | ------------------------------------ |
| **Endpoint**         | `POST /auth/request_password_reset/` |
| **Authentication**   | None (Public)                        |
| **Role Restriction** | None                                 |

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Validation:**

- User must exist and be verified

**Success Response (200 OK):**

```json
{
  "message": "If an account with this email exists, a reset link has been sent."
}
```

**Note:** Same message whether email exists or not (security)

**Side Effects:**

- Generates reset token (base64 encoded user_id)
- Sends reset email with link: `{frontend_url}/reset-password?uid={uid}&token={token}`
- Token expires in 24 hours (Django default token generator)

---

### **7. Confirm Password Reset**

| Attribute            | Value                                |
| -------------------- | ------------------------------------ |
| **Endpoint**         | `POST /auth/confirm_password_reset/` |
| **Authentication**   | None (Public)                        |
| **Role Restriction** | None                                 |

**Request Body:**

```json
{
  "uid": "NTUwZTg0MDA=", // base64 encoded
  "token": "4ue-abc123def456",
  "new_password": "NewSecurePassword123"
}
```

**Validation:**

- uid must be valid and decode to real user_id
- token must be valid for that user
- token must not be expired (24 hours)
- new_password minimum 8 characters

**Success Response (200 OK):**

```json
{
  "message": "Password reset successful. You can now login."
}
```

**Failure Responses:**

- `400 Bad Request` - Invalid uid or token
- `400 Bad Request` - Expired token
- `400 Bad Request` - Password too weak

**Side Effects:**

- Updates User.password (hashed)
- Old tokens become invalid
- User must login with new password

---

### **8. Get Current User Profile**

| Attribute            | Value                |
| -------------------- | -------------------- |
| **Endpoint**         | `GET /auth/profile/` |
| **Authentication**   | Required (JWT)       |
| **Role Restriction** | None                 |

**Request Headers:**

```
Authorization: JWT {access_token}
```

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "seeker",
  "is_verified": true,
  "is_active": true,
  "profile": {
    "phone_number": "+1234567890",
    "bio": "Experienced software engineer",
    "avatar": "https://res.cloudinary.com/...",
    "skills": "Python, Django, JavaScript",
    "experience": "2020-01-15",
    "experience_years": 4.1,
    "resume": "https://res.cloudinary.com/..."
  },
  "created_at": "2026-02-21T10:00:00Z",
  "updated_at": "2026-02-21T10:00:00Z"
}
```

**Failure Responses:**

- `401 Unauthorized` - Invalid or missing token
- `401 Unauthorized` - Token expired

---

### **9. Update User Profile**

| Attribute            | Value                         |
| -------------------- | ----------------------------- |
| **Endpoint**         | `PATCH /auth/update_profile/` |
| **Authentication**   | Required (JWT)                |
| **Role Restriction** | None                          |
| **Method**           | Partial Update (PATCH)        |

**Request Body (all optional):**

```json
{
  "full_name": "John Doe Updated",
  "profile": {
    "phone_number": "+1234567890",
    "bio": "Updated bio",
    "avatar": "<file>",
    "skills": "Python, Django, JavaScript",
    "experience": "2020-01-15",
    "resume": "<file>"
  }
}
```

**Validation Rules:**

- full_name max 150 characters
- phone_number max 15 characters
- bio max 1000 characters
- skills text field
- avatar: JPG, PNG, GIF (max 1MB)
- resume: PDF, DOC, DOCX (max 5MB)
- experience: cannot be in future

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe Updated",
  "email": "john@example.com",
  "role": "seeker",
  "profile": {
    "phone_number": "+1234567890",
    "bio": "Updated bio",
    "avatar": "https://res.cloudinary.com/...",
    "skills": "Python, Django, JavaScript",
    "experience": "2020-01-15",
    "experience_years": 4.1,
    "resume": "https://res.cloudinary.com/..."
  },
  "created_at": "2026-02-21T10:00:00Z",
  "updated_at": "2026-02-21T11:30:00Z"
}
```

**Failure Responses:**

- `400 Bad Request` - Invalid file type or size
- `400 Bad Request` - Invalid experience date
- `401 Unauthorized` - Missing token

**File Handling:**

- Old files automatically deleted from Cloudinary
- New files uploaded immediately
- URL returned in response

---

### **10. Change Password**

| Attribute            | Value                         |
| -------------------- | ----------------------------- |
| **Endpoint**         | `POST /auth/change_password/` |
| **Authentication**   | Required (JWT)                |
| **Role Restriction** | None                          |

**Request Body:**

```json
{
  "old_password": "CurrentPassword123",
  "new_password": "NewPassword456"
}
```

**Validation:**

- old_password must be correct
- new_password minimum 8 characters
- new_password != old_password

**Success Response (200 OK):**

```json
{
  "message": "Password changed successfully!"
}
```

**Failure Responses:**

- `400 Bad Request` - Incorrect old password
- `400 Bad Request` - New password too weak
- `401 Unauthorized` - Missing token

---

### **11. Logout User**

| Attribute            | Value                |
| -------------------- | -------------------- |
| **Endpoint**         | `POST /auth/logout/` |
| **Authentication**   | Required (JWT)       |
| **Role Restriction** | None                 |

**Request Body:** Empty

**Success Response (200 OK):**

```json
{
  "message": "Logged out successfully. Delete your tokens to complete logout."
}
```

**Note:** Token deletion handled on client side (localStorage/sessionStorage)

---

## Job Management Endpoints

Base Path: `/api/jobs/`

### **1. List All Jobs (Public)**

| Attribute            | Value             |
| -------------------- | ----------------- |
| **Endpoint**         | `GET /jobs/`      |
| **Authentication**   | None (Public)     |
| **Role Restriction** | None              |
| **Pagination**       | Yes (10 per page) |

**Query Parameters:**

| Parameter   | Type    | Description          | Example             |
| ----------- | ------- | -------------------- | ------------------- |
| `page`      | Integer | Page number          | `?page=2`           |
| `page_size` | Integer | Items per page       | `?page_size=20`     |
| `category`  | Enum    | Filter by category   | `?category=it`      |
| `job_type`  | Enum    | Filter by type       | `?job_type=remote`  |
| `location`  | String  | Filter by location   | `?location=NYC`     |
| `search`    | String  | Search title/company | `?search=python`    |
| `ordering`  | String  | Sort order           | `?ordering=-salary` |

**Category Options:** it, healthcare, finance, education, marketing, design, other

**Job Type Options:** full_time, part_time, remote, contract, internship

**Success Response (200 OK):**

```json
{
  "count": 150,
  "next": "https://api.example.com/api/jobs/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Senior Django Developer",
      "company_name": "Tech Corp",
      "company_logo": "https://res.cloudinary.com/...",
      "location": "NYC",
      "job_type": "remote",
      "category": "it",
      "salary": 150000,
      "recruiter_name": "Jane Smith",
      "created_at": "2026-02-20T10:00:00Z",
      "updated_at": "2026-02-20T10:00:00Z"
    }
  ]
}
```

**Example Requests:**

- `/jobs/?category=it&job_type=remote` - IT remote jobs
- `/jobs/?location=NYC&search=python` - Python jobs in NYC
- `/jobs/?ordering=-salary` - Highest paying jobs first
- `/jobs/?category=healthcare&page=2` - Healthcare jobs, page 2

---

### **2. Create New Job (Recruiter Only)**

| Attribute            | Value          |
| -------------------- | -------------- |
| **Endpoint**         | `POST /jobs/`  |
| **Authentication**   | Required (JWT) |
| **Role Restriction** | Recruiter only |

**Request Body:**

```json
{
  "title": "Senior Django Developer",
  "description": "Looking for experienced Django developer...",
  "requirements": "5+ years Django, PostgreSQL, DRF experience",
  "location": "NYC",
  "job_type": "remote",
  "category": "it",
  "company_name": "Tech Corp",
  "salary": 150000,
  "experience_required": 5,
  "position_count": 2,
  "company_logo": "<file>",
  "application_deadline": "2026-03-21T23:59:59Z"
}
```

**Required Fields:**

- title, description, requirements, location, job_type, category, company_name

**Optional Fields:**

- salary, experience_required, position_count, company_logo, application_deadline

**Validation:**

- salary > 0 (if provided)
- experience_required ≥ 0
- position_count ≥ 1
- company_logo: JPG, PNG, JPEG (max 1MB)
- application_deadline: must be in future

**Success Response (201 Created):**

```json
{
  "id": 1,
  "title": "Senior Django Developer",
  "description": "Looking for experienced Django developer...",
  "requirements": "5+ years Django, PostgreSQL, DRF experience",
  "location": "NYC",
  "job_type": "remote",
  "category": "it",
  "salary": 150000,
  "experience_required": 5,
  "position_count": 2,
  "company_name": "Tech Corp",
  "company_logo": "https://res.cloudinary.com/...",
  "application_deadline": "2026-03-21T23:59:59Z",
  "recruiter_name": "Jane Smith",
  "recruiter_email": "jane@example.com",
  "created_at": "2026-02-21T10:00:00Z",
  "updated_at": "2026-02-21T10:00:00Z"
}
```

**Failure Responses:**

- `400 Bad Request` - Missing required fields
- `400 Bad Request` - Invalid file type/size
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not a recruiter

---

### **3. Get Job Details**

| Attribute            | Value             |
| -------------------- | ----------------- |
| **Endpoint**         | `GET /jobs/{id}/` |
| **Authentication**   | None (Public)     |
| **Role Restriction** | None              |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "title": "Senior Django Developer",
  "description": "Looking for experienced Django developer...",
  "requirements": "5+ years Django, PostgreSQL, DRF experience",
  "location": "NYC",
  "job_type": "remote",
  "category": "it",
  "salary": 150000,
  "experience_required": 5,
  "position_count": 2,
  "company_name": "Tech Corp",
  "company_logo": "https://res.cloudinary.com/...",
  "application_deadline": "2026-03-21T23:59:59Z",
  "recruiter_name": "Jane Smith",
  "recruiter_email": "jane@example.com",
  "created_at": "2026-02-21T10:00:00Z",
  "updated_at": "2026-02-21T10:00:00Z"
}
```

**Failure Responses:**

- `404 Not Found` - Job doesn't exist

---

### **4. Update Job (Recruiter Only)**

| Attribute            | Value                   |
| -------------------- | ----------------------- |
| **Endpoint**         | `PATCH /jobs/{id}/`     |
| **Authentication**   | Required (JWT)          |
| **Role Restriction** | Recruiter who posted it |
| **Method**           | Partial Update (PATCH)  |

**Request Body (all optional):**

```json
{
  "title": "Updated Title",
  "salary": 160000,
  "position_count": 3,
  "application_deadline": "2026-04-21T23:59:59Z"
}
```

**Success Response (200 OK):** Updated job object

**Failure Responses:**

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the recruiter who posted it
- `404 Not Found` - Job doesn't exist

---

### **5. Delete Job (Recruiter Only)**

| Attribute            | Value                   |
| -------------------- | ----------------------- |
| **Endpoint**         | `DELETE /jobs/{id}/`    |
| **Authentication**   | Required (JWT)          |
| **Role Restriction** | Recruiter who posted it |

**Success Response (204 No Content):**

```json
{
  "message": "Job deleted successfully"
}
```

**Side Effects:**

- Deletes all applications for this job
- Deletes all reviews for this job
- Cascades through related feedback

---

### **6. Get My Jobs (Recruiter Only)**

| Attribute            | Value                |
| -------------------- | -------------------- |
| **Endpoint**         | `GET /jobs/my_jobs/` |
| **Authentication**   | Required (JWT)       |
| **Role Restriction** | Recruiter only       |

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "title": "Senior Django Developer",
    "company_name": "Tech Corp",
    "company_logo": "https://res.cloudinary.com/...",
    "location": "NYC",
    "job_type": "remote",
    "category": "it",
    "salary": 150000,
    "recruiter_name": "Jane Smith",
    "created_at": "2026-02-20T10:00:00Z",
    "updated_at": "2026-02-20T10:00:00Z"
  },
  {
    "id": 2,
    "title": "Python Backend Engineer",
    "company_name": "Tech Corp",
    "company_logo": "https://res.cloudinary.com/...",
    "location": "SF",
    "job_type": "full_time",
    "category": "it",
    "salary": 140000,
    "recruiter_name": "Jane Smith",
    "created_at": "2026-02-19T10:00:00Z",
    "updated_at": "2026-02-19T10:00:00Z"
  }
]
```

---

### **7. Get Similar Jobs**

| Attribute            | Value                          |
| -------------------- | ------------------------------ |
| **Endpoint**         | `GET /jobs/{id}/similar_jobs/` |
| **Authentication**   | None (Public)                  |
| **Role Restriction** | None                           |

**Filters:** Same category AND location as requested job

**Success Response (200 OK):**

```json
[
  {
    "id": 3,
    "title": "Python Backend Engineer",
    "company_name": "StartUp Inc",
    "location": "NYC",
    "job_type": "remote",
    "category": "it",
    "salary": 130000,
    "recruiter_name": "Bob Johnson",
    "created_at": "2026-02-18T10:00:00Z"
  },
  {
    "id": 4,
    "title": "Full Stack Developer",
    "company_name": "Tech Solutions",
    "location": "NYC",
    "job_type": "full_time",
    "category": "it",
    "salary": 145000,
    "recruiter_name": "Alice Williams",
    "created_at": "2026-02-17T10:00:00Z"
  }
]
```

**Note:** Maximum 5 results, excludes the requested job

---

## Application Endpoints

Base Path: `/api/applications/`

### **1. List Applications (Role-Filtered)**

| Attribute            | Value                                   |
| -------------------- | --------------------------------------- |
| **Endpoint**         | `GET /applications/`                    |
| **Authentication**   | Required (JWT)                          |
| **Role Restriction** | Different views for seeker vs recruiter |
| **Pagination**       | Yes (10 per page)                       |

**Seeker View:** Shows their own applications  
**Recruiter View:** Shows applications to their jobs

**Query Parameters:**

- `page` - Page number
- `job` - Filter by job_id
- `status` - pending, reviewed, accepted, rejected
- `search` - Search by name/email/job title
- `ordering` - Sort order

**Success Response (200 OK):**

```json
{
  "count": 25,
  "next": "https://api.example.com/api/applications/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "job": 5,
      "job_title": "Senior Django Developer",
      "job_company": "Tech Corp",
      "applicant_name": "John Doe",
      "applicant_email": "john@example.com",
      "status": "pending",
      "applied_at": "2026-02-21T10:00:00Z",
      "updated_at": "2026-02-21T10:00:00Z"
    }
  ]
}
```

**Failure Responses:**

- `401 Unauthorized` - Missing token
- `403 Forbidden` - Trying to access others' applications

---

### **2. Apply to Job (Seeker Only)**

| Attribute            | Value                 |
| -------------------- | --------------------- |
| **Endpoint**         | `POST /applications/` |
| **Authentication**   | Required (JWT)        |
| **Role Restriction** | Job Seeker only       |

**Request Body:**

```json
{
  "job_id": 5,
  "resume": "<file>",
  "cover_letter": "I'm interested in this position because..."
}
```

**Required Fields:**

- job_id
- resume (file)

**Optional Fields:**

- cover_letter (max 2000 characters)

**Validation:**

- resume: PDF, DOC, DOCX (max 5MB)
- job_id must exist
- cannot apply to same job twice
- cannot apply to own jobs (if recruiter role)

**Success Response (201 Created):**

```json
{
  "id": 1,
  "job": {
    "id": 5,
    "title": "Senior Django Developer",
    "description": "Looking for experienced Django developer...",
    "requirements": "5+ years Django, PostgreSQL, DRF experience",
    "location": "NYC",
    "job_type": "remote",
    "category": "it",
    "salary": 150000,
    "experience_required": 5,
    "position_count": 2,
    "company_name": "Tech Corp",
    "company_logo": "https://res.cloudinary.com/...",
    "application_deadline": "2026-03-21T23:59:59Z",
    "recruiter_name": "Jane Smith",
    "recruiter_email": "jane@example.com",
    "created_at": "2026-02-20T10:00:00Z",
    "updated_at": "2026-02-20T10:00:00Z"
  },
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "+1234567890",
  "applicant_bio": "Experienced developer",
  "resume": "https://res.cloudinary.com/...",
  "cover_letter": "I'm interested in this position because...",
  "status": "pending",
  "applied_at": "2026-02-21T10:00:00Z",
  "updated_at": "2026-02-21T10:00:00Z"
}
```

**Side Effects:**

- Email to applicant confirming application
- Email to recruiter notifying of new application
- Creates Application record

**Failure Responses:**

- `400 Bad Request` - Already applied to this job
- `400 Bad Request` - Invalid file type/size
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not a job seeker

---

### **3. Get Application Details**

| Attribute            | Value                           |
| -------------------- | ------------------------------- |
| **Endpoint**         | `GET /applications/{id}/`       |
| **Authentication**   | Required (JWT)                  |
| **Role Restriction** | Seeker or recruiter of that job |

**Success Response (200 OK):** Full application object with nested job details

**Failure Responses:**

- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not allowed to view
- `404 Not Found` - Application doesn't exist

---

### **4. Update Application Status (Recruiter Only)**

| Attribute            | Value                        |
| -------------------- | ---------------------------- |
| **Endpoint**         | `PATCH /applications/{id}/`  |
| **Authentication**   | Required (JWT)               |
| **Role Restriction** | Recruiter who posted the job |
| **Method**           | Partial Update (PATCH)       |

**Request Body:**

```json
{
  "status": "reviewed"
}
```

**Valid Status Values:**

- pending → reviewed
- reviewed → accepted or rejected
- (cannot revert from accepted/rejected)

**Success Response (200 OK):** Updated application object

**Failure Responses:**

- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not the recruiter
- `404 Not Found` - Application doesn't exist

---

### **5. Update Status with Feedback**

| Attribute            | Value                                    |
| -------------------- | ---------------------------------------- |
| **Endpoint**         | `POST /applications/{id}/update_status/` |
| **Authentication**   | Required (JWT)                           |
| **Role Restriction** | Recruiter who posted the job             |

**Request Body:**

```json
{
  "status": "accepted",
  "feedback_text": "We were impressed by your experience. Let's schedule an interview!"
}
```

**Required Fields:**

- status
- feedback_text (required for this action, max 1000 characters)

**Success Response (200 OK):**

```json
{
  "message": "Application status updated with feedback",
  "application": {
    /* full application object */
  },
  "feedback": {
    "id": 1,
    "feedback_text": "We were impressed by your experience. Let's schedule an interview!",
    "status_given": "accepted",
    "created_at": "2026-02-21T11:00:00Z"
  }
}
```

**Side Effects:**

- Updates Application.status
- Creates ApplicationFeedback record
- Sends email to applicant with feedback:
  - If accepted: Congratulatory email
  - If rejected: Rejection with feedback
  - Otherwise: Status update email

**Failure Responses:**

- `400 Bad Request` - Invalid status or missing feedback
- `400 Bad Request` - Feedback too long (>1000 chars)
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not the recruiter

---

### **6. Delete Application (Seeker Only)**

| Attribute            | Value                          |
| -------------------- | ------------------------------ |
| **Endpoint**         | `DELETE /applications/{id}/`   |
| **Authentication**   | Required (JWT)                 |
| **Role Restriction** | The applicant who submitted it |

**Success Response (204 No Content):**

```json
{
  "message": "Application deleted successfully"
}
```

**Failure Responses:**

- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not the applicant
- `404 Not Found` - Application doesn't exist

---

### **7. Get My Applications (Seeker Only)**

| Attribute            | Value                                |
| -------------------- | ------------------------------------ |
| **Endpoint**         | `GET /applications/my_applications/` |
| **Authentication**   | Required (JWT)                       |
| **Role Restriction** | Job Seeker only                      |

**Success Response (200 OK):** List of seeker's applications

---

### **8. Get Job Applications (Recruiter Only)**

| Attribute            | Value                                 |
| -------------------- | ------------------------------------- |
| **Endpoint**         | `GET /applications/job_applications/` |
| **Authentication**   | Required (JWT)                        |
| **Role Restriction** | Recruiter only                        |

**Query Parameters:**

- `job_id` - Optional, filter by specific job

**Success Response (200 OK):** List of applications to recruiter's jobs

---

### **9. Get Application Status Summary**

| Attribute            | Value                               |
| -------------------- | ----------------------------------- |
| **Endpoint**         | `GET /applications/status_summary/` |
| **Authentication**   | Required (JWT)                      |
| **Role Restriction** | Seeker or Recruiter                 |

**Success Response (200 OK):**

```json
{
  "total": 15,
  "pending": 5,
  "reviewed": 3,
  "accepted": 2,
  "rejected": 5
}
```

**Note:** Different totals depending on role (seeker shows their apps, recruiter shows received apps)

---

### **10. Get Applicant Profile**

| Attribute            | Value                                       |
| -------------------- | ------------------------------------------- |
| **Endpoint**         | `GET /applications/{id}/applicant_profile/` |
| **Authentication**   | Required (JWT)                              |
| **Role Restriction** | Recruiter or applicant                      |

**Success Response (200 OK):** Full user profile of applicant

---

### **11. Get Application Feedback**

| Attribute            | Value                              |
| -------------------- | ---------------------------------- |
| **Endpoint**         | `GET /applications/{id}/feedback/` |
| **Authentication**   | Required (JWT)                     |
| **Role Restriction** | Applicant or recruiter             |

**Success Response (200 OK):**

```json
{
  "id": 1,
  "application": 5,
  "recruiter_name": "Jane Smith",
  "recruiter_email": "jane@example.com",
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "job_title": "Senior Django Developer",
  "feedback_text": "We were impressed by your experience...",
  "status_given": "accepted",
  "created_at": "2026-02-21T11:00:00Z",
  "updated_at": "2026-02-21T11:00:00Z"
}
```

**Failure Response:**

- `404 Not Found` - No feedback yet for this application

---

## Review Endpoints

Base Path: `/api/reviews/`

### **1. List All Reviews (Public)**

| Attribute            | Value             |
| -------------------- | ----------------- |
| **Endpoint**         | `GET /reviews/`   |
| **Authentication**   | None (Public)     |
| **Role Restriction** | None              |
| **Pagination**       | Yes (10 per page) |

**Query Parameters:**

- `page` - Page number
- `recruiter` - Filter by recruiter_id
- `job` - Filter by job_id
- `rating` - Filter by exact rating (1-5)
- `search` - Search by name/title/comment
- `ordering` - Sort (created_at, rating)

**Success Response (200 OK):**

```json
{
  "count": 85,
  "next": "https://api.example.com/api/reviews/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "job": 5,
      "job_title": "Senior Django Developer",
      "recruiter_name": "Jane Smith",
      "recruiter_email": "jane@example.com",
      "reviewer_name": "John Doe",
      "reviewer_email": "john@example.com",
      "rating": 5,
      "created_at": "2026-02-21T10:00:00Z"
    }
  ]
}
```

---

### **2. Create Review (Seeker Only)**

| Attribute            | Value            |
| -------------------- | ---------------- |
| **Endpoint**         | `POST /reviews/` |
| **Authentication**   | Required (JWT)   |
| **Role Restriction** | Job Seeker only  |

**Request Body:**

```json
{
  "job_id": 5,
  "rating": 5,
  "comment": "Great company to work with. The interview process was smooth and professional."
}
```

**Required Fields:**

- job_id
- rating (1-5)

**Optional Fields:**

- comment (max 1000 characters)

**Validation:**

- rating must be 1-5
- job_id must exist
- User must have applied to this job
- Cannot review twice for same job
- Cannot review own jobs (if recruiter)

**Success Response (201 Created):**

```json
{
  "id": 1,
  "job": {
    "id": 5,
    "title": "Senior Django Developer",
    "company_name": "Tech Corp",
    "company_logo": "https://res.cloudinary.com/...",
    "location": "NYC",
    "job_type": "remote",
    "category": "it",
    "salary": 150000,
    "recruiter_name": "Jane Smith",
    "recruiter_email": "jane@example.com",
    "created_at": "2026-02-20T10:00:00Z",
    "updated_at": "2026-02-20T10:00:00Z"
  },
  "recruiter_name": "Jane Smith",
  "recruiter_email": "jane@example.com",
  "reviewer_name": "John Doe",
  "reviewer_email": "john@example.com",
  "rating": 5,
  "comment": "Great company to work with...",
  "created_at": "2026-02-21T10:00:00Z"
}
```

**Side Effects:**

- Email to recruiter notifying of new review
- Review visible on recruiter profile

**Failure Responses:**

- `400 Bad Request` - Rating not 1-5
- `400 Bad Request` - Haven't applied to this job
- `400 Bad Request` - Already reviewed this job
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Not a job seeker

---

### **3. Get Review Details**

| Attribute            | Value                |
| -------------------- | -------------------- |
| **Endpoint**         | `GET /reviews/{id}/` |
| **Authentication**   | None (Public)        |
| **Role Restriction** | None                 |

**Success Response (200 OK):** Full review object with all details

---

### **4. Update Review (Seeker Only)**

| Attribute            | Value                  |
| -------------------- | ---------------------- |
| **Endpoint**         | `PATCH /reviews/{id}/` |
| **Authentication**   | Required (JWT)         |
| **Role Restriction** | The reviewer           |
| **Method**           | Partial Update (PATCH) |

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Updated comment with more details..."
}
```

**Success Response (200 OK):** Updated review object

---

### **5. Delete Review (Seeker Only)**

| Attribute            | Value                   |
| -------------------- | ----------------------- |
| **Endpoint**         | `DELETE /reviews/{id}/` |
| **Authentication**   | Required (JWT)          |
| **Role Restriction** | The reviewer            |

**Success Response (204 No Content):**

```json
{
  "message": "Review deleted successfully"
}
```

---

### **6. Get Recruiter Reviews**

| Attribute            | Value                             |
| -------------------- | --------------------------------- |
| **Endpoint**         | `GET /reviews/recruiter_reviews/` |
| **Authentication**   | None (Public)                     |
| **Role Restriction** | None                              |

**Query Parameters:**

- `recruiter_id` - Required, filter by recruiter
- `job_id` - Optional, filter by specific job

**Success Response (200 OK):** List of reviews for the recruiter

---

### **7. Get Recruiter Statistics**

| Attribute            | Value                                |
| -------------------- | ------------------------------------ |
| **Endpoint**         | `GET /reviews/recruiter_statistics/` |
| **Authentication**   | None (Public)                        |
| **Role Restriction** | None                                 |

**Query Parameters:**

- `recruiter_id` - Required

**Success Response (200 OK):**

```json
{
  "total_reviews": 20,
  "average_rating": 4.5,
  "five_star": 12,
  "four_star": 5,
  "three_star": 2,
  "two_star": 1,
  "one_star": 0
}
```

---

### **8. Get My Reviews (Seeker)**

| Attribute            | Value                      |
| -------------------- | -------------------------- |
| **Endpoint**         | `GET /reviews/my_reviews/` |
| **Authentication**   | Required (JWT)             |
| **Role Restriction** | Job Seeker only            |

**Success Response (200 OK):** List of reviews written by seeker

---

### **9. Get My Received Reviews (Recruiter)**

| Attribute            | Value                               |
| -------------------- | ----------------------------------- |
| **Endpoint**         | `GET /reviews/my_received_reviews/` |
| **Authentication**   | Required (JWT)                      |
| **Role Restriction** | Recruiter only                      |

**Success Response (200 OK):** List of reviews received by recruiter

---

### **10. Get Job Reviews**

| Attribute            | Value                       |
| -------------------- | --------------------------- |
| **Endpoint**         | `GET /reviews/job_reviews/` |
| **Authentication**   | None (Public)               |
| **Role Restriction** | None                        |

**Query Parameters:**

- `job_id` - Required

**Success Response (200 OK):** List of reviews for the job

---

### **11. Get Top Recruiters**

| Attribute            | Value                          |
| -------------------- | ------------------------------ |
| **Endpoint**         | `GET /reviews/top_recruiters/` |
| **Authentication**   | None (Public)                  |
| **Role Restriction** | None                           |

**Query Parameters:**

- `limit` - Optional, default 10, max 100

**Success Response (200 OK):**

```json
[
  {
    "recruiter": 1,
    "recruiter__full_name": "Jane Smith",
    "avg_rating": 4.8,
    "review_count": 25
  },
  {
    "recruiter": 2,
    "recruiter__full_name": "Bob Johnson",
    "avg_rating": 4.5,
    "review_count": 18
  }
]
```

---

### **12. Mark Review as Helpful**

| Attribute            | Value                         |
| -------------------- | ----------------------------- |
| **Endpoint**         | `POST /reviews/{id}/helpful/` |
| **Authentication**   | Required (JWT)                |
| **Role Restriction** | None                          |

**Request Body:** Empty

**Success Response (200 OK):**

```json
{
  "message": "Review marked as helpful",
  "helpful_count": 5
}
```

**OR if toggling off:**

```json
{
  "message": "Review marked as not helpful",
  "helpful_count": 4
}
```

**Note:** This is a toggle - first call marks helpful, second call removes the vote

---

### **13. Get Helpful Votes Info**

| Attribute            | Value                              |
| -------------------- | ---------------------------------- |
| **Endpoint**         | `GET /reviews/{id}/helpful_votes/` |
| **Authentication**   | None (Public)                      |
| **Role Restriction** | None                               |

**Success Response (200 OK):**

```json
{
  "review_id": 1,
  "helpful_count": 5,
  "is_helpful_by_current_user": true
}
```

**Note:** is_helpful_by_current_user is false if user not authenticated

---

## HTTP Status Codes

| Code    | Meaning               | Usage                                              |
| ------- | --------------------- | -------------------------------------------------- |
| **200** | OK                    | Successful GET, PATCH, PUT                         |
| **201** | Created               | Successful POST (resource created)                 |
| **204** | No Content            | Successful DELETE                                  |
| **400** | Bad Request           | Invalid input, validation errors                   |
| **401** | Unauthorized          | Missing or invalid authentication token            |
| **403** | Forbidden             | Authenticated but not authorized for this resource |
| **404** | Not Found             | Resource doesn't exist                             |
| **409** | Conflict              | Resource already exists (duplicate)                |
| **429** | Too Many Requests     | Rate limit exceeded                                |
| **500** | Internal Server Error | Server error                                       |
| **503** | Service Unavailable   | Server temporarily unavailable                     |

---

## Error Handling

All error responses follow this format:

**4xx Client Error:**

```json
{
  "error": "Descriptive error message",
  "detail": "Additional details if applicable"
}
```

**Example:**

```json
{
  "error": "Already applied to this job",
  "detail": "You can only apply once per job"
}
```

**Field Validation Error:**

```json
{
  "field_name": ["Error message for this field"]
}
```

**Example:**

```json
{
  "email": ["Enter a valid email address."],
  "password": ["This password is too common."]
}
```

---

## Rate Limiting

**Global Limits:**

- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- File uploads: 50 per hour per user

**Specific Endpoints:**

- `/auth/register/` - 5/hour per IP
- `/auth/login/` - 10/hour per IP
- `/auth/request_password_reset/` - 3/hour per email
- File uploads - 10MB max per request

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645370400
```

---

## Pagination

**Default Behavior:**

- 10 items per page
- First page: `page=1` or omitted

**Response Format:**

```json
{
  "count": 150,
  "next": "https://api.example.com/api/jobs/?page=2",
  "previous": null,
  "results": [...]
}
```

**Examples:**

- `/jobs/?page=2` - Second page
- `/jobs/?page=5&page_size=20` - Page 5, 20 items per page
- `/jobs/` - First page (default)

---

## Authentication

**JWT Token Structure:**

Header:

```
Authorization: JWT {access_token}
```

**Token Refresh:**

- Access token expires in 24 hours
- Use refresh token to get new access token
- Refresh token expires in 30 days

**Example Request:**

```bash
curl -H "Authorization: JWT eyJhbGciOiJIUzI1NiIs..." \
  https://api.example.com/api/auth/profile/
```

---

## Filtering & Searching

**Search Example:**

- `/jobs/?search=python` - Searches title, company_name, description
- `/applications/?search=john` - Searches applicant name/email
- `/reviews/?search=django` - Searches comment, job title, recruiter name

**Filtering Example:**

- `/jobs/?category=it&job_type=remote` - Multiple filters (AND operation)
- `/reviews/?rating=5` - Specific rating
- `/applications/?status=pending` - Pending applications

**Ordering Example:**

- `/jobs/?ordering=-salary` - Highest salary first (descending)
- `/jobs/?ordering=created_at` - Oldest first (ascending)
- `/reviews/?ordering=-rating` - Highest rated first
