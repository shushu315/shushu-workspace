-- ============================================================
-- 树树工作台 · 三端同步数据表
-- 用法：在 Supabase 后台左侧 SQL Editor → New query → 粘贴全部 → 点 Run
-- 执行一次即可，重复执行不会报错、不会丢数据
-- ============================================================

-- 1) 建表：每个用户一行，data 存整个工作台数据（JSON）
create table if not exists public.workspace_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) 开启行级安全：用户只能读写自己的那一行
alter table public.workspace_data enable row level security;

-- 3) 安全策略（先删后建，保证可重复执行）
drop policy if exists "select own data" on public.workspace_data;
create policy "select own data" on public.workspace_data
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own data" on public.workspace_data;
create policy "insert own data" on public.workspace_data
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own data" on public.workspace_data;
create policy "update own data" on public.workspace_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) 完成。下面这句只是验证，Run 后应显示 "sync table ready"
select 'sync table ready' as result;
