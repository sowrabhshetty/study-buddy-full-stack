-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Planner tasks policies
CREATE POLICY "tasks_select_own" ON public.planner_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON public.planner_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON public.planner_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON public.planner_tasks FOR DELETE USING (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "sessions_select_own" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

-- AI conversations policies
CREATE POLICY "conversations_select_own" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conversations_insert_own" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conversations_update_own" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "conversations_delete_own" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- Quiz definitions policies
CREATE POLICY "quizzes_select_own" ON public.quiz_definitions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quizzes_insert_own" ON public.quiz_definitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quizzes_update_own" ON public.quiz_definitions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quizzes_delete_own" ON public.quiz_definitions FOR DELETE USING (auth.uid() = user_id);

-- Quiz attempts policies
CREATE POLICY "attempts_select_own" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics logs policies
CREATE POLICY "analytics_select_own" ON public.analytics_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "analytics_insert_own" ON public.analytics_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
