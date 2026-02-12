

# Canvas LMS Course Import for Professors

## Overview
Add a "Import from Canvas" button on the teacher dashboard that automatically pulls the professor's courses from your school's Canvas LMS and adds them to the app. Professors just click a button and select which courses to import -- no manual course creation needed.

## How It Works
1. Professor clicks "Import from Canvas" on their dashboard
2. The app matches the professor to their Canvas account using their email address
3. Their Canvas courses are fetched and displayed in a selection dialog
4. Professor picks which courses to import, and they appear on the dashboard ready to use

## Setup Required
Two pieces of information from your school's Canvas admin are needed:
- **Canvas Base URL** -- your school's Canvas address (e.g. `https://yourschool.instructure.com`)
- **Canvas Admin API Token** -- an admin-level access token that can look up any instructor's courses

These will be stored securely as backend secrets.

## Technical Details

### 1. Store Canvas Secrets
Add two new secrets:
- `CANVAS_BASE_URL` -- the school's Canvas instance URL
- `CANVAS_API_TOKEN` -- admin API token for Canvas

### 2. New Backend Function: `canvas-courses`
A backend function that:
- Authenticates the professor via their login token
- Looks up their email from the profiles table
- Calls Canvas API: `GET /api/v1/accounts/self/users?search_term={email}` to find the Canvas user
- Fetches that user's courses: `GET /api/v1/users/{canvas_user_id}/courses?enrollment_type=teacher`
- Returns the list of Canvas courses (id, name, course_code) to the frontend

### 3. New Backend Function: `canvas-import`
A backend function that:
- Receives a list of selected Canvas course IDs and names
- Creates entries in the `courses` table with `lms_course_id` set to the Canvas course ID
- Skips any courses already imported (matching on `lms_course_id`)
- Returns the newly created courses

### 4. Teacher Dashboard UI Updates
- Add an "Import from Canvas" button alongside "Add Course" on the teacher dashboard
- Opens a dialog showing available Canvas courses with checkboxes
- Courses already imported are shown as disabled/greyed out
- "Import Selected" button creates the courses and refreshes the list
- Already-imported courses show a small Canvas badge on their card

### 5. Database
No schema changes needed -- the existing `courses` table already has an `lms_course_id` column for this purpose.

