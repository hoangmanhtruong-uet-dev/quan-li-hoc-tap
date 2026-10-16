# API Specification

## Authentication

### POST /api/auth/register
- Request:
  - email
  - password
  - full_name
- Response:
  - user_id
  - email
  - full_name

### POST /api/auth/login
- Request:
  - email
  - password
- Response:
  - access_token
  - token_type
  - expires_in

### GET /api/auth/me
- Response:
  - user_id
  - email
  - full_name
  - role

## Today Dashboard

### GET /api/dashboard/today
- Response:
  - today_schedule: [ { title, start_time, end_time, location, instructor, progress_percent } ]
  - nearest_deadline: { title, course_name, due_date, days_remaining, priority }
  - upcoming_exams: [ { title, course_name, exam_date, days_remaining, coverage_percent } ]
  - ai_tasks: [ { title, description, recommendation_id } ]
  - daily_plan: [ { title, duration_minutes, status } ]
  - weekly_goal_progress: { completed: int, total: int, percent }
  - risk_alerts: [ { course_name, issue, severity } ]
  - team_action_items: [ { task_id, title, workspace_name, due_date } ]

### POST /api/dashboard/session/start
- Request:
  - session_type: enum('pomodoro','focus')
  - references: [
      { link_type: enum('schedule','deadline','exam_topic','roadmap_node','team_task','course'), link_id: UUID }
    ]
- Response:
  - session_id
  - started_at

### POST /api/dashboard/session/complete
- Request:
  - session_id
  - duration_minutes
  - references_completed: [
      { link_type: enum('schedule','deadline','exam_topic','roadmap_node','team_task','course'), link_id: UUID }
    ]
  - notes
- Response:
  - success
  - updated_course_progress: [ { course_name, week_start_date, progress_percent } ]

### POST /api/dashboard/session/cancel
- Request:
  - session_id
- Response:
  - success


## Academic Hub

### Schedule

#### GET /api/schedules
- Query params: user_id optional if auth inferred
- Response: list of schedule items

#### POST /api/schedules
- Request:
  - title
  - day_of_week
  - start_time
  - end_time
  - location
  - instructor
  - meeting_link
  - repeat_weekly
  - notes
- Response: created schedule item

#### PUT /api/schedules/{schedule_id}
- Request: same fields as POST
- Response: updated schedule item

#### DELETE /api/schedules/{schedule_id}
- Response: success

### Deadlines

#### GET /api/deadlines
- Response: list of deadlines with tasks and progress

#### POST /api/deadlines
- Request:
  - title
  - course_name
  - due_date
  - priority
  - estimated_duration_minutes
  - description
- Response: created deadline

#### GET /api/deadlines/{deadline_id}
- Response: deadline details and nested tasks

#### PUT /api/deadlines/{deadline_id}
- Request: same fields as POST
- Response: updated deadline

#### DELETE /api/deadlines/{deadline_id}
- Response: success

### Deadline subtasks

#### POST /api/deadlines/{deadline_id}/tasks
- Request:
  - title
  - order_index
- Response: created subtask

#### PATCH /api/deadline-tasks/{task_id}
- Request:
  - completed
  - title
  - order_index
- Response: updated task

#### DELETE /api/deadline-tasks/{task_id}
- Response: success

### Exams

#### GET /api/exams
- Response: list of exam events

#### POST /api/exams
- Request:
  - title
  - course_name
  - due_date
  - priority
  - description
- Response: created exam event

#### POST /api/exams/{exam_id}/topics
- Request:
  - topic_name
  - coverage_percent
  - weak_score_percent
- Response: created topic

#### PUT /api/exams/topics/{topic_id}
- Request: same fields
- Response: updated topic

#### DELETE /api/exams/topics/{topic_id}
- Response: success

### Grades

#### GET /api/grades
- Response: list of course grades

#### POST /api/grades
- Request:
  - course_name
  - attendance_weight
  - midterm_weight
  - final_weight
  - current_attendance_score
  - current_midterm_score
- Response: created grade record

#### PUT /api/grades/{grade_id}
- Request: same fields plus expected_final_score
- Response: updated grade record

#### GET /api/grades/{grade_id}/simulation
- Response:
  - current_grade
  - required_final_score_for_Bplus
  - required_final_score_for_A

### Documents and uploads

#### POST /api/documents/upload
- Request: multipart/form-data file, access_scope
- Response: document metadata

#### GET /api/documents
- Response: list of uploaded documents

#### GET /api/documents/{document_id}
- Response: metadata

## AI Study Coach

### POST /api/ai/recommendations/daily-plan
- Request:
  - date
  - available_minutes
  - active_courses
  - current_focus
- Response:
  - recommended_blocks: [ { course_name, topic, duration_minutes, reason } ]
  - summary

### POST /api/ai/recommendations/deadline-split
- Request:
  - deadline_id
  - due_date
  - estimated_duration_minutes
- Response:
  - sub_tasks: [ { title, order_index } ]
  - schedule_recommendation

### POST /api/ai/recommendations/daily-plan/missed
- Request:
  - date
  - reason: enum('missed_previous_plan','user_skipped','no_sessions_yet')
  - available_minutes
  - active_courses
- Response:
  - recommendation_id
  - recommended_blocks: [ { course_name, topic, duration_minutes, reason } ]
  - summary

### POST /api/ai/recommendations/{recommendation_id}/apply
- Request:
  - action_type: enum('create_deadline_tasks','create_daily_plan_blocks','update_roadmap_node_status','create_team_task')
  - action_payload: json
- Response:
  - applied_recommendation_id

### POST /api/ai/recommendations/{recommendation_id}/dismiss
- Response:
  - success

### GET /api/ai/recommendations/{recommendation_id}
- Response: ai recommendation details


### POST /api/ai/roadmap/suggest-step
- Request:
  - roadmap_profile_id
  - completed_node_ids
- Response:
  - next_step
  - rationale

### POST /api/ai/documents/query
- Request:
  - document_ids
  - query_text
- Response:
  - results: [ { document_id, excerpt, relevance_score } ]

## Roadmap AI

### GET /api/roadmap
- Response: current roadmap profile and nodes

### POST /api/roadmap
- Request:
  - career_goal
  - domain
  - known_skills
  - study_preferences
- Response: created roadmap

### PUT /api/roadmap/nodes/{node_id}
- Request:
  - status
  - estimated_effort_minutes
- Response: updated node

## Team Workspace

### GET /api/teams
- Response: list of workspaces user belongs to

### POST /api/teams
- Request:
  - name
  - description
- Response: created team workspace

### GET /api/teams/{team_id}
- Response: workspace details, members, tasks

### POST /api/teams/{team_id}/members
- Request:
  - user_email
  - role
- Response: invitation or membership created

### POST /api/teams/{team_id}/tasks
- Request:
  - title
  - description
  - assignee_user_id
  - priority
  - due_date
- Response: created task

### PATCH /api/teams/tasks/{task_id}
- Request:
  - status
  - assignee_user_id
  - priority
- Response: updated task

### GET /api/teams/{team_id}/tasks/{task_id}/comments
- Response: comment list

### POST /api/teams/tasks/{task_id}/comments
- Request:
  - comment_text
- Response: created comment

## Error handling

- All endpoints return standard HTTP status codes.
- Validation errors return 400 with field-level details.
- Authentication errors return 401.
- Authorization errors return 403.
- Missing resources return 404.
- Server errors return 500.

## Notes

- Use JWT for auth with short-lived access tokens.
- All user-specific calls infer `user_id` from auth token.
- AI endpoints return suggested actions only; any schedule change must require explicit confirmation.
- Document query endpoint is MVP semantic-support-ready but can fall back to keyword search if embedding is unavailable.
