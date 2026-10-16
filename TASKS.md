# TASKS

## Task categories
- Product & design
- Backend
- Frontend
- AI / recommendations
- QA & validation
- Documentation

## Priority task list for MVP

### 1. Architecture & foundation
1.1. Define data model and service boundaries
1.2. Set up repository structure and backend project
1.3. Set up authentication and authorization
1.4. Create common API error handling

### 2. Core user profile
2.1. Implement user registration/login
2.2. Implement student profile capture
2.3. Implement basic onboarding questions for roadmap

### 3. Today dashboard
3.1. Build `GET /api/dashboard/today`
3.2. Implement session start/complete/cancel endpoints (study_sessions + session links)
3.3. Design Today page UI wireframe and content cards
3.4. Connect Today page to schedule, deadlines, exams, AI tasks


### 4. Academic Hub - schedule
4.1. Implement schedule CRUD endpoints
4.2. Build schedule UI list and event editor
4.3. Support weekly repeating events
4.4. Display today/weekly schedule on Today page

### 5. Academic Hub - deadlines
5.1. Implement deadline CRUD endpoints
5.2. Implement deadline task/subtask management
5.3. Build deadline detail UI
5.4. Show nearest deadline on Today page

### 6. Academic Hub - exams
6.1. Implement exam event CRUD endpoints
6.2. Implement exam topic tracking
6.3. Build exam overview UI
6.4. Show upcoming exams on Today page

### 7. Academic Hub - grades
7.1. Implement course grade CRUD endpoints
7.2. Implement grade component model and grade calculation
7.3. Build grade detail UI with predicted final requirements
7.4. Surface course risk alerts on Today page

### 8. AI Study Coach
8.1. Implement AI recommendation engine scaffold
8.2. Build daily plan recommendation endpoint
8.3. Build deadline split recommendation endpoint
8.4. Build roadmap next-step suggestion endpoint
8.5. Connect AI recommendations to Today and Academic Hub
8.6. Implement recommendation apply/dismiss endpoints and persistence (ai_recommendations → applied_recommendations)


### 9. Roadmap AI
9.1. Implement roadmap profile and node CRUD
9.2. Build onboarding flow for career goal selection
9.3. Render roadmap stages and progress
9.4. Enable node status updates and next-step advice

### 10. Team Workspace
10.1. Implement team workspace creation and membership
10.2. Implement team task CRUD and comments
10.3. Build Kanban-style team task board UI
10.4. Show team action items on Today page
10.5. Add AI load-balancing warning suggestion

### 11. Document uploads / AI docs
11.1. Implement file upload endpoint
11.2. Store metadata and enforce access_scope
11.3. Build simple document listing UI
11.4. Implement MVP document query endpoint

### 12. Quality, security, and validation
12.1. Review and apply security checklist items
12.2. Implement role-based authorization for team resources
12.3. Add input validation for all create/update forms
12.4. Write API contract tests

## Task dependencies
- 1.x must complete before 2.x, 3.x, 4.x, 5.x.
- 2.1 and 2.2 required before Roadmap AI, Today, and Team Workspace user-specific data.
- 4.x and 5.x must complete before 3.4 and 8.x to provide data feeds.
- 6.x and 7.x required before Today risk alerts and AI recommendations.
- 8.1 should follow core data models and UI for AI-recommended actions.
- 9.x depends on 2.3 and 8.4.
- 10.x depends on core auth, team membership logic, and Today summary integration.
- 11.x is optional for MVP but useful for AI docs. It can be implemented after core AI recommendation endpoints.

## Tasks held for later phases
- Import Google Calendar.
- OCR upload scheduling from images.
- Full semantic search with vector store and pgvector.
- Multi-domain roadmap support beyond IT.
- Finance module full implementation.
- Auto-schedule resync without user confirmation.
- Advanced team RLS and workspace privacy policies.
