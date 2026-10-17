/**
 * Supabase Database TypeScript Schema Definitions for CampusOS
 * Auto-generated & typed for Supabase PostgreSQL Client
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          student_id: string | null;
          school: string;
          major: string;
          academic_year: string;
          bio: string | null;
          role: 'USER' | 'PLATFORM_ADMIN';
          status: 'active' | 'banned';
          email_verified: boolean;
          onboarding_completed: boolean;
          xp: number;
          level: number;
          rank_title: string;
          streak: number;
          streak_freezes: number;
          study_minutes_total: number;
          weekly_goal_minutes: number;
          weekly_study_minutes: number;
          last_study_date: string | null;
          daily_mood: string | null;
          vibe_theme: 'aurora' | 'y2k' | 'cyber' | 'pastel';
          reduced_motion: boolean;
          gpa: number;
          badges: Json;
          violation_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          student_id?: string | null;
          school?: string;
          major?: string;
          academic_year?: string;
          bio?: string | null;
          role?: 'USER' | 'PLATFORM_ADMIN';
          status?: 'active' | 'banned';
          email_verified?: boolean;
          onboarding_completed?: boolean;
          xp?: number;
          level?: number;
          rank_title?: string;
          streak?: number;
          streak_freezes?: number;
          study_minutes_total?: number;
          weekly_goal_minutes?: number;
          weekly_study_minutes?: number;
          last_study_date?: string | null;
          daily_mood?: string | null;
          vibe_theme?: 'aurora' | 'y2k' | 'cyber' | 'pastel';
          reduced_motion?: boolean;
          gpa?: number;
          badges?: Json;
          violation_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          student_id?: string | null;
          school?: string;
          major?: string;
          academic_year?: string;
          bio?: string | null;
          role?: 'USER' | 'PLATFORM_ADMIN';
          status?: 'active' | 'banned';
          email_verified?: boolean;
          onboarding_completed?: boolean;
          xp?: number;
          level?: number;
          rank_title?: string;
          streak?: number;
          streak_freezes?: number;
          study_minutes_total?: number;
          weekly_goal_minutes?: number;
          weekly_study_minutes?: number;
          last_study_date?: string | null;
          daily_mood?: string | null;
          vibe_theme?: 'aurora' | 'y2k' | 'cyber' | 'pastel';
          reduced_motion?: boolean;
          gpa?: number;
          badges?: Json;
          violation_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          course: string | null;
          course_id: string | null;
          status: 'todo' | 'doing' | 'done' | 'in_progress';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          difficulty: number;
          due_date: string | null;
          estimated_minutes: number;
          estimate_min: number;
          actual_min: number;
          eisenhower_quadrant: string | null;
          quadrant: 'do_first' | 'schedule' | 'delegate' | 'eliminate';
          subtasks: Json;
          attachments: Json;
          activity_log: Json;
          pomodoro_planned: number;
          pomodoro_done: number;
          tags: string[];
          order_index: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          course?: string | null;
          course_id?: string | null;
          status?: 'todo' | 'doing' | 'done' | 'in_progress';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          difficulty?: number;
          due_date?: string | null;
          estimated_minutes?: number;
          estimate_min?: number;
          actual_min?: number;
          eisenhower_quadrant?: string | null;
          quadrant?: 'do_first' | 'schedule' | 'delegate' | 'eliminate';
          subtasks?: Json;
          attachments?: Json;
          activity_log?: Json;
          pomodoro_planned?: number;
          pomodoro_done?: number;
          tags?: string[];
          order_index?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          course?: string | null;
          course_id?: string | null;
          status?: 'todo' | 'doing' | 'done' | 'in_progress';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          difficulty?: number;
          due_date?: string | null;
          estimated_minutes?: number;
          estimate_min?: number;
          actual_min?: number;
          eisenhower_quadrant?: string | null;
          quadrant?: 'do_first' | 'schedule' | 'delegate' | 'eliminate';
          subtasks?: Json;
          attachments?: Json;
          activity_log?: Json;
          pomodoro_planned?: number;
          pomodoro_done?: number;
          tags?: string[];
          order_index?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      courses: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          name: string;
          lecturer: string | null;
          instructor: string | null;
          room: string | null;
          credits: number;
          color: string;
          semester: string;
          schedule: string | null;
          syllabus_url: string | null;
          grade_components: Json;
          final_score: number | null;
          letter_grade: string;
          status: 'ongoing' | 'passed' | 'warning' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          name: string;
          lecturer?: string | null;
          instructor?: string | null;
          room?: string | null;
          credits?: number;
          color?: string;
          semester?: string;
          schedule?: string | null;
          syllabus_url?: string | null;
          grade_components?: Json;
          final_score?: number | null;
          letter_grade?: string;
          status?: 'ongoing' | 'passed' | 'warning' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          name?: string;
          lecturer?: string | null;
          instructor?: string | null;
          room?: string | null;
          credits?: number;
          color?: string;
          semester?: string;
          schedule?: string | null;
          syllabus_url?: string | null;
          grade_components?: Json;
          final_score?: number | null;
          letter_grade?: string;
          status?: 'ongoing' | 'passed' | 'warning' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      course_syllabus: {
        Row: {
          id: string;
          course_id: string;
          week_number: number;
          topic: string;
          description: string | null;
          slides_url: string | null;
          materials: Json;
          slides_attachments: Json;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          week_number: number;
          topic: string;
          description?: string | null;
          slides_url?: string | null;
          materials?: Json;
          slides_attachments?: Json;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          week_number?: number;
          topic?: string;
          description?: string | null;
          slides_url?: string | null;
          materials?: Json;
          slides_attachments?: Json;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_syllabus_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };

      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          avatar_url: string | null;
          course_code: string | null;
          course_name: string | null;
          semester: string | null;
          type: 'project' | 'research' | 'competition' | 'PERSONAL' | 'CLUB' | 'HOUSEHOLD';
          progress_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          avatar_url?: string | null;
          course_code?: string | null;
          course_name?: string | null;
          semester?: string | null;
          type?: 'project' | 'research' | 'competition' | 'PERSONAL' | 'CLUB' | 'HOUSEHOLD';
          progress_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          avatar_url?: string | null;
          course_code?: string | null;
          course_name?: string | null;
          semester?: string | null;
          type?: 'project' | 'research' | 'competition' | 'PERSONAL' | 'CLUB' | 'HOUSEHOLD';
          progress_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspaces_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
          joined_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      workspace_kanban_tasks: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          status: 'todo' | 'doing' | 'review' | 'done';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id: string | null;
          due_date: string | null;
          subtasks: Json;
          attachments: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          status?: 'todo' | 'doing' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id?: string | null;
          due_date?: string | null;
          subtasks?: Json;
          attachments?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          status?: 'todo' | 'doing' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id?: string | null;
          due_date?: string | null;
          subtasks?: Json;
          attachments?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_kanban_tasks_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };

      workspace_documents: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          name: string | null;
          file_url: string;
          url: string | null;
          file_type: string | null;
          category: 'report' | 'slides' | 'source' | 'reference';
          file_size: number | null;
          uploaded_by: string;
          uploader_id: string | null;
          uploader_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          name?: string | null;
          file_url: string;
          url?: string | null;
          file_type?: string | null;
          category?: 'report' | 'slides' | 'source' | 'reference';
          file_size?: number | null;
          uploaded_by: string;
          uploader_id?: string | null;
          uploader_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          name?: string | null;
          file_url?: string;
          url?: string | null;
          file_type?: string | null;
          category?: 'report' | 'slides' | 'source' | 'reference';
          file_size?: number | null;
          uploaded_by?: string;
          uploader_id?: string | null;
          uploader_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_documents_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };

      workspace_activities: {
        Row: {
          id: string;
          workspace_id: string;
          actor_id: string | null;
          actor_name: string;
          actor_avatar: string | null;
          action: string;
          target: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          actor_id?: string | null;
          actor_name: string;
          actor_avatar?: string | null;
          action: string;
          target: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          actor_id?: string | null;
          actor_name?: string;
          actor_avatar?: string | null;
          action?: string;
          target?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_activities_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };

      clubs: {
        Row: {
          id: string;
          name: string;
          short_name: string | null;
          category: string;
          description: string | null;
          avatar_url: string | null;
          president_id: string;
          owner_id: string | null;
          established_year: number;
          cover_gradient: string | null;
          icon_name: string | null;
          tags: string[];
          general_fund_balance: number;
          event_fund_balance: number;
          reserve_fund_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name?: string | null;
          category: string;
          description?: string | null;
          avatar_url?: string | null;
          president_id: string;
          owner_id?: string | null;
          established_year?: number;
          cover_gradient?: string | null;
          icon_name?: string | null;
          tags?: string[];
          general_fund_balance?: number;
          event_fund_balance?: number;
          reserve_fund_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string | null;
          category?: string;
          description?: string | null;
          avatar_url?: string | null;
          president_id?: string;
          owner_id?: string | null;
          established_year?: number;
          cover_gradient?: string | null;
          icon_name?: string | null;
          tags?: string[];
          general_fund_balance?: number;
          event_fund_balance?: number;
          reserve_fund_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clubs_president_id_fkey';
            columns: ['president_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      club_members: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: string;
          department: string;
          student_id: string | null;
          active_score: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          role?: string;
          department?: string;
          student_id?: string | null;
          active_score?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string;
          role?: string;
          department?: string;
          student_id?: string | null;
          active_score?: number;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_members_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
        ];
      };

      club_events: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          location: string | null;
          budget: number;
          budget_vnd: number;
          category: string;
          department: string | null;
          max_attendees: number;
          attendee_ids: Json;
          banner_gradient: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          budget?: number;
          budget_vnd?: number;
          category?: string;
          department?: string | null;
          max_attendees?: number;
          attendee_ids?: Json;
          banner_gradient?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          budget?: number;
          budget_vnd?: number;
          category?: string;
          department?: string | null;
          max_attendees?: number;
          attendee_ids?: Json;
          banner_gradient?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_events_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
        ];
      };

      club_finances: {
        Row: {
          id: string;
          club_id: string;
          type: 'income' | 'expense';
          amount: number;
          category: string;
          fund_type: 'general' | 'event' | 'reserve';
          description: string;
          recorded_by: string;
          receipt_url: string | null;
          transaction_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          type: 'income' | 'expense';
          amount: number;
          category: string;
          fund_type?: 'general' | 'event' | 'reserve';
          description: string;
          recorded_by: string;
          receipt_url?: string | null;
          transaction_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          category?: string;
          fund_type?: 'general' | 'event' | 'reserve';
          description?: string;
          recorded_by?: string;
          receipt_url?: string | null;
          transaction_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_finances_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
        ];
      };

      club_tasks: {
        Row: {
          id: string;
          club_id: string;
          event_id: string | null;
          title: string;
          description: string | null;
          department: string | null;
          assignee_ids: Json;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'todo' | 'in_progress' | 'review' | 'done';
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          event_id?: string | null;
          title: string;
          description?: string | null;
          department?: string | null;
          assignee_ids?: Json;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'todo' | 'in_progress' | 'review' | 'done';
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          event_id?: string | null;
          title?: string;
          description?: string | null;
          department?: string | null;
          assignee_ids?: Json;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'todo' | 'in_progress' | 'review' | 'done';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_tasks_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
        ];
      };

      dorm_spaces: {
        Row: {
          id: string;
          name: string;
          room_number: string;
          building: string | null;
          address: string | null;
          type: 'dorm' | 'apartment' | 'house';
          common_fund_balance: number;
          created_by: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          room_number: string;
          building?: string | null;
          address?: string | null;
          type?: 'dorm' | 'apartment' | 'house';
          common_fund_balance?: number;
          created_by: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          room_number?: string;
          building?: string | null;
          address?: string | null;
          type?: 'dorm' | 'apartment' | 'house';
          common_fund_balance?: number;
          created_by?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dorm_spaces_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      dorm_members: {
        Row: {
          id: string;
          space_id: string;
          user_id: string;
          nickname: string | null;
          phone: string | null;
          role: 'lead' | 'member';
          net_balance: number;
          penalty_points: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id: string;
          nickname?: string | null;
          phone?: string | null;
          role?: 'lead' | 'member';
          net_balance?: number;
          penalty_points?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          user_id?: string;
          nickname?: string | null;
          phone?: string | null;
          role?: 'lead' | 'member';
          net_balance?: number;
          penalty_points?: number;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dorm_members_space_id_fkey';
            columns: ['space_id'];
            referencedRelation: 'dorm_spaces';
            referencedColumns: ['id'];
          },
        ];
      };

      dorm_chores: {
        Row: {
          id: string;
          space_id: string;
          title: string;
          assigned_to: string | null;
          day_of_week: string | null;
          due_date: string | null;
          status: 'pending' | 'completed' | 'missed' | 'done';
          penalty_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          title: string;
          assigned_to?: string | null;
          day_of_week?: string | null;
          due_date?: string | null;
          status?: 'pending' | 'completed' | 'missed' | 'done';
          penalty_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          title?: string;
          assigned_to?: string | null;
          day_of_week?: string | null;
          due_date?: string | null;
          status?: 'pending' | 'completed' | 'missed' | 'done';
          penalty_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dorm_chores_space_id_fkey';
            columns: ['space_id'];
            referencedRelation: 'dorm_spaces';
            referencedColumns: ['id'];
          },
        ];
      };

      dorm_expenses: {
        Row: {
          id: string;
          space_id: string;
          title: string;
          total_amount: number;
          amount: number | null;
          type: 'electric' | 'water' | 'internet' | 'rent' | 'trash' | 'food' | 'other';
          month: string | null;
          paid_by: string;
          split_type: string;
          status: 'paid' | 'pending' | 'overdue';
          split_member_ids: Json;
          due_date: string | null;
          usage_start_index: number | null;
          usage_end_index: number | null;
          usage_unit: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          title: string;
          total_amount: number;
          amount?: number | null;
          type?: 'electric' | 'water' | 'internet' | 'rent' | 'trash' | 'food' | 'other';
          month?: string | null;
          paid_by: string;
          split_type?: string;
          status?: 'paid' | 'pending' | 'overdue';
          split_member_ids?: Json;
          due_date?: string | null;
          usage_start_index?: number | null;
          usage_end_index?: number | null;
          usage_unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          title?: string;
          total_amount?: number;
          amount?: number | null;
          type?: 'electric' | 'water' | 'internet' | 'rent' | 'trash' | 'food' | 'other';
          month?: string | null;
          paid_by?: string;
          split_type?: string;
          status?: 'paid' | 'pending' | 'overdue';
          split_member_ids?: Json;
          due_date?: string | null;
          usage_start_index?: number | null;
          usage_end_index?: number | null;
          usage_unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dorm_expenses_space_id_fkey';
            columns: ['space_id'];
            referencedRelation: 'dorm_spaces';
            referencedColumns: ['id'];
          },
        ];
      };

      student_notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'academic' | 'deadline' | 'club' | 'system';
          is_read: boolean;
          is_urgent: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: 'academic' | 'deadline' | 'club' | 'system';
          is_read?: boolean;
          is_urgent?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'academic' | 'deadline' | 'club' | 'system';
          is_read?: boolean;
          is_urgent?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      // Legacy & Pomodoro Sync tables compatibility
      student_profiles: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          level: number;
          rank_title: string;
          streak: number;
          streak_freezes: number;
          study_minutes_total: number;
          weekly_goal_minutes: number;
          weekly_study_minutes: number;
          last_study_date: string | null;
          daily_mood: string | null;
          vibe_theme: string;
          reduced_motion: boolean;
          violation_count: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          xp?: number;
          level?: number;
          rank_title?: string;
          streak?: number;
          streak_freezes?: number;
          study_minutes_total?: number;
          weekly_goal_minutes?: number;
          weekly_study_minutes?: number;
          last_study_date?: string | null;
          daily_mood?: string | null;
          vibe_theme?: string;
          reduced_motion?: boolean;
          violation_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          xp?: number;
          level?: number;
          rank_title?: string;
          streak?: number;
          streak_freezes?: number;
          study_minutes_total?: number;
          weekly_goal_minutes?: number;
          weekly_study_minutes?: number;
          last_study_date?: string | null;
          daily_mood?: string | null;
          vibe_theme?: string;
          reduced_motion?: boolean;
          violation_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      student_deadlines: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          course: string | null;
          due_date: string | null;
          date: string | null;
          display_date: string | null;
          urgent: boolean;
          completed: boolean;
          is_exam: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          title: string;
          course?: string | null;
          due_date?: string | null;
          date?: string | null;
          display_date?: string | null;
          urgent?: boolean;
          completed?: boolean;
          is_exam?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          course?: string | null;
          due_date?: string | null;
          date?: string | null;
          display_date?: string | null;
          urgent?: boolean;
          completed?: boolean;
          is_exam?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      student_calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          type: string;
          location: string | null;
          description: string | null;
          done: boolean;
          checklist: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          type: string;
          location?: string | null;
          description?: string | null;
          done?: boolean;
          checklist?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          type?: string;
          location?: string | null;
          description?: string | null;
          done?: boolean;
          checklist?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      student_focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          focus_minutes: number;
          mode: string;
          discipline_score: number;
          shame_count: number;
          violation_count: number;
          xp_gained: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          focus_minutes: number;
          mode?: string;
          discipline_score?: number;
          shame_count?: number;
          violation_count?: number;
          xp_gained?: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          focus_minutes?: number;
          mode?: string;
          discipline_score?: number;
          shame_count?: number;
          violation_count?: number;
          xp_gained?: number;
          completed_at?: string;
        };
        Relationships: [];
      };

      ai_syllabus_summaries: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          source_file_url: string;
          file_name: string;
          summary_markdown: string;
          key_formulas: Json;
          core_concepts: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          source_file_url: string;
          file_name: string;
          summary_markdown: string;
          key_formulas?: Json;
          core_concepts?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          chapter_id?: string;
          source_file_url?: string;
          file_name?: string;
          summary_markdown?: string;
          key_formulas?: Json;
          core_concepts?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ai_generated_quizzes: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          title: string;
          source_file_url: string;
          questions: Json;
          total_questions: number;
          max_xp_reward: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          title: string;
          source_file_url: string;
          questions?: Json;
          total_questions?: number;
          max_xp_reward?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          chapter_id?: string;
          title?: string;
          source_file_url?: string;
          questions?: Json;
          total_questions?: number;
          max_xp_reward?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      course_flashcards: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          front_term: string;
          back_definition: string;
          category: string | null;
          example: string | null;
          difficulty: number;
          interval_days: number;
          repetitions: number;
          ease_factor: number;
          last_quality: number;
          next_review_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          front_term: string;
          back_definition: string;
          category?: string | null;
          example?: string | null;
          difficulty?: number;
          interval_days?: number;
          repetitions?: number;
          ease_factor?: number;
          last_quality?: number;
          next_review_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          chapter_id?: string;
          front_term?: string;
          back_definition?: string;
          category?: string | null;
          example?: string | null;
          difficulty?: number;
          interval_days?: number;
          repetitions?: number;
          ease_factor?: number;
          last_quality?: number;
          next_review_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      pdf_qa_messages: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          source_file_url: string;
          role: string;
          content: string;
          citations: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          chapter_id: string;
          source_file_url: string;
          role: string;
          content: string;
          citations?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          chapter_id?: string;
          source_file_url?: string;
          role?: string;
          content?: string;
          citations?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { p_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: { p_workspace_id: string };
        Returns: boolean;
      };
      is_club_member: {
        Args: { p_club_id: string };
        Returns: boolean;
      };
      is_club_admin: {
        Args: { p_club_id: string };
        Returns: boolean;
      };
      is_dorm_member: {
        Args: { p_space_id: string };
        Returns: boolean;
      };
      is_dorm_admin: {
        Args: { p_space_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenient Entity Type Aliases for Application Code
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export type CourseSyllabusRow = Database['public']['Tables']['course_syllabus']['Row'];
export type CourseSyllabusInsert = Database['public']['Tables']['course_syllabus']['Insert'];
export type CourseSyllabusUpdate = Database['public']['Tables']['course_syllabus']['Update'];

export type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];
export type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update'];

export type WorkspaceMemberRow = Database['public']['Tables']['workspace_members']['Row'];
export type WorkspaceMemberInsert = Database['public']['Tables']['workspace_members']['Insert'];
export type WorkspaceMemberUpdate = Database['public']['Tables']['workspace_members']['Update'];

export type WorkspaceKanbanTaskRow = Database['public']['Tables']['workspace_kanban_tasks']['Row'];
export type WorkspaceKanbanTaskInsert = Database['public']['Tables']['workspace_kanban_tasks']['Insert'];
export type WorkspaceKanbanTaskUpdate = Database['public']['Tables']['workspace_kanban_tasks']['Update'];

export type WorkspaceDocumentRow = Database['public']['Tables']['workspace_documents']['Row'];
export type WorkspaceDocumentInsert = Database['public']['Tables']['workspace_documents']['Insert'];
export type WorkspaceDocumentUpdate = Database['public']['Tables']['workspace_documents']['Update'];

export type WorkspaceActivityRow = Database['public']['Tables']['workspace_activities']['Row'];
export type WorkspaceActivityInsert = Database['public']['Tables']['workspace_activities']['Insert'];
export type WorkspaceActivityUpdate = Database['public']['Tables']['workspace_activities']['Update'];

export type ClubRow = Database['public']['Tables']['clubs']['Row'];
export type ClubInsert = Database['public']['Tables']['clubs']['Insert'];
export type ClubUpdate = Database['public']['Tables']['clubs']['Update'];

export type ClubMemberRow = Database['public']['Tables']['club_members']['Row'];
export type ClubMemberInsert = Database['public']['Tables']['club_members']['Insert'];
export type ClubMemberUpdate = Database['public']['Tables']['club_members']['Update'];

export type ClubEventRow = Database['public']['Tables']['club_events']['Row'];
export type ClubEventInsert = Database['public']['Tables']['club_events']['Insert'];
export type ClubEventUpdate = Database['public']['Tables']['club_events']['Update'];

export type ClubFinanceRow = Database['public']['Tables']['club_finances']['Row'];
export type ClubFinanceInsert = Database['public']['Tables']['club_finances']['Insert'];
export type ClubFinanceUpdate = Database['public']['Tables']['club_finances']['Update'];

export type ClubTaskRow = Database['public']['Tables']['club_tasks']['Row'];
export type ClubTaskInsert = Database['public']['Tables']['club_tasks']['Insert'];
export type ClubTaskUpdate = Database['public']['Tables']['club_tasks']['Update'];

export type DormSpaceRow = Database['public']['Tables']['dorm_spaces']['Row'];
export type DormSpaceInsert = Database['public']['Tables']['dorm_spaces']['Insert'];
export type DormSpaceUpdate = Database['public']['Tables']['dorm_spaces']['Update'];

export type DormMemberRow = Database['public']['Tables']['dorm_members']['Row'];
export type DormMemberInsert = Database['public']['Tables']['dorm_members']['Insert'];
export type DormMemberUpdate = Database['public']['Tables']['dorm_members']['Update'];

export type DormChoreRow = Database['public']['Tables']['dorm_chores']['Row'];
export type DormChoreInsert = Database['public']['Tables']['dorm_chores']['Insert'];
export type DormChoreUpdate = Database['public']['Tables']['dorm_chores']['Update'];

export type DormExpenseRow = Database['public']['Tables']['dorm_expenses']['Row'];
export type DormExpenseInsert = Database['public']['Tables']['dorm_expenses']['Insert'];
export type DormExpenseUpdate = Database['public']['Tables']['dorm_expenses']['Update'];

export type StudentNotificationRow = Database['public']['Tables']['student_notifications']['Row'];
export type StudentNotificationInsert = Database['public']['Tables']['student_notifications']['Insert'];
export type StudentNotificationUpdate = Database['public']['Tables']['student_notifications']['Update'];

export type StudentFocusSessionRow = Database['public']['Tables']['student_focus_sessions']['Row'];
export type StudentFocusSessionInsert = Database['public']['Tables']['student_focus_sessions']['Insert'];
export type StudentFocusSessionUpdate = Database['public']['Tables']['student_focus_sessions']['Update'];

export type StudentProfileRow = Database['public']['Tables']['student_profiles']['Row'];
export type StudentProfileInsert = Database['public']['Tables']['student_profiles']['Insert'];
export type StudentProfileUpdate = Database['public']['Tables']['student_profiles']['Update'];
