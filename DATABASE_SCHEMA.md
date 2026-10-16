# Database Schema

## 1. Entities

### users
- id: UUID, PK
- email: varchar, unique, not null
- password_hash: varchar, not null
- full_name: varchar
- role: enum('USER','PLATFORM_ADMIN') default 'USER'
- status: enum('active','banned') default 'active'
- created_at: timestamp
- updated_at: timestamp

### student_profiles
- id: UUID, PK
- user_id: UUID, FK users(id)
- school_name: varchar
- major: varchar
- current_semester: varchar
- target_gpa: numeric(3,2)
- timezone: varchar
- created_at: timestamp
- updated_at: timestamp

### schedules
- id: UUID, PK
- user_id: UUID, FK users(id)
- title: varchar
- day_of_week: int (1-7)
- start_time: time
- end_time: time
- location: varchar
- instructor: varchar
- meeting_link: varchar
- repeat_weekly: boolean
- notes: text
- progress_percent: smallint
- created_at: timestamp
- updated_at: timestamp

### academic_events
- id: UUID, PK
- user_id: UUID, FK users(id)
- type: enum('deadline','exam','study_goal')
- title: varchar
- course_name: varchar
- due_date: timestamp
- priority: enum('low','medium','high')
- estimated_duration_minutes: int
- status: enum('planned','in_progress','completed','missed') default 'planned'
- description: text
- created_at: timestamp
- updated_at: timestamp

### deadline_tasks
- id: UUID, PK
- deadline_id: UUID, FK academic_events(id)
- title: varchar
- completed: boolean
- order_index: int
- notes: text
- created_at: timestamp
- updated_at: timestamp

### exam_topics
- id: UUID, PK
- academic_event_id: UUID, FK academic_events(id)
- topic_name: varchar
- coverage_percent: smallint
- weak_score_percent: smallint
- created_at: timestamp
- updated_at: timestamp

### course_grades
- id: UUID, PK
- user_id: UUID, FK users(id)
- course_name: varchar
- attendance_weight: numeric(5,2)
- midterm_weight: numeric(5,2)
- final_weight: numeric(5,2)
- current_attendance_score: numeric(5,2)
- current_midterm_score: numeric(5,2)
- expected_final_score: numeric(5,2)
- computed_current_grade: numeric(5,2)
- created_at: timestamp
- updated_at: timestamp

### grade_components
- id: UUID, PK
- course_grade_id: UUID, FK course_grades(id)
- component_name: varchar
- weight_percent: numeric(5,2)
- score: numeric(5,2) null
- component_type: enum('attendance','midterm','final','project','quiz')
- created_at: timestamp
- updated_at: timestamp

### roadmap_profiles
- id: UUID, PK
- user_id: UUID, FK users(id)
- career_goal: varchar
- domain: varchar
- created_at: timestamp
- updated_at: timestamp

### roadmap_nodes
- id: UUID, PK
- roadmap_profile_id: UUID, FK roadmap_profiles(id)
- title: varchar
- description: text
- status: enum('completed','in_progress','pending') default 'pending'
- priority: enum('core','optional') default 'core'
- prerequisites: text
- estimated_effort_minutes: int
- stage_index: int
- created_at: timestamp
- updated_at: timestamp

### team_workspaces
- id: UUID, PK
- owner_user_id: UUID, FK users(id)
- name: varchar
- description: text
- progress_percent: smallint
- created_at: timestamp
- updated_at: timestamp

### team_memberships
- id: UUID, PK
- team_workspace_id: UUID, FK team_workspaces(id)
- user_id: UUID, FK users(id)
- role: enum('OWNER','ADMIN','MANAGER','MEMBER','VIEWER') default 'MEMBER'
- joined_at: timestamp

### team_tasks
- id: UUID, PK
- team_workspace_id: UUID, FK team_workspaces(id)
- title: varchar
- description: text
- assignee_user_id: UUID, FK users(id) null
- status: enum('todo','doing','done') default 'todo'
- priority: enum('low','medium','high') default 'medium'
- due_date: timestamp null
- created_by_user_id: UUID, FK users(id)
- created_at: timestamp
- updated_at: timestamp

### team_task_comments
- id: UUID, PK
- team_task_id: UUID, FK team_tasks(id)
- user_id: UUID, FK users(id)
- comment_text: text
- created_at: timestamp

### ai_recommendations
- id: UUID, PK
- user_id: UUID, FK users(id)
- recommendation_type: enum('daily_plan','deadline_split','exam_focus','roadmap_step','team_balance')
- payload: jsonb
- status: enum('suggested','accepted','dismissed') default 'suggested'
- created_at: timestamp
- updated_at: timestamp

### uploaded_documents
- id: UUID, PK
- user_id: UUID, FK users(id)
- filename: varchar
- storage_path: varchar
- content_type: varchar
- vector_embedding: vector null
- access_scope: enum('private','team') default 'private'
- created_at: timestamp
- updated_at: timestamp

### study_sessions
- id: UUID, PK
- user_id: UUID, FK users(id)
- session_type: enum('pomodoro','focus')
- started_at: timestamp
- completed_at: timestamp null
- duration_minutes: int null
- completed: boolean default false
- notes: text null
- created_at: timestamp
- updated_at: timestamp

### study_session_links
- id: UUID, PK
- session_id: UUID, FK study_sessions(id)
- link_type: enum('schedule','deadline','exam_topic','roadmap_node','team_task','course')
- link_id: UUID
- created_at: timestamp

### course_progress
- id: UUID, PK
- user_id: UUID, FK users(id)
- course_name: varchar
- week_start_date: date
- target_percent: smallint null
- progress_percent: smallint default 0
- updated_at: timestamp
- created_at: timestamp

### applied_recommendations
- id: UUID, PK
- recommendation_id: UUID, FK ai_recommendations(id)
- user_id: UUID, FK users(id)
- action_type: enum('create_deadline_tasks','create_daily_plan_blocks','update_roadmap_node_status','create_team_task')
- action_payload: jsonb
- created_at: timestamp

### activity_logs
- id: UUID, PK
- user_id: UUID, FK users(id)
- action: varchar
- details: text
- created_at: timestamp


## 2. Relationships

- `users` 1:n `student_profiles`
- `users` 1:n `schedules`
- `users` 1:n `academic_events`
- `academic_events` 1:n `deadline_tasks`
- `academic_events` 1:n `exam_topics`
- `users` 1:n `course_grades`
- `course_grades` 1:n `grade_components`
- `users` 1:1 `roadmap_profiles`
- `roadmap_profiles` 1:n `roadmap_nodes`
- `team_workspaces` 1:n `team_memberships`
- `team_workspaces` 1:n `team_tasks`
- `team_tasks` 1:n `team_task_comments`
- `users` 1:n `uploaded_documents`
- `users` 1:n `ai_recommendations`

## 3. Notes for MVP

- `vector_embedding` is included for future semantic search; MVP may store embeddings later.
- `uploaded_documents.access_scope` supports private/team-level control without full RLS complexity.
- `ai_recommendations.payload` lưu trữ dữ liệu gợi ý hành động, cho phép audit và tái hiển thị.
- `academic_events.type` thu gọn lịch deadline/exam/study_goal để đơn giản schema cho MVP.

## 4. Role Architecture

### PlatformRole (users.role)
- `USER` — default, regular platform user
- `PLATFORM_ADMIN` — full system admin

### WorkspaceRole (team_memberships.role)
- `OWNER` — workspace creator, full control
- `ADMIN` — can manage members, settings
- `MANAGER` — can manage tasks/content
- `MEMBER` — can participate
- `VIEWER` — read-only access

A user is assigned a PlatformRole globally. Within each workspace (club, living space), they hold a separate WorkspaceRole.