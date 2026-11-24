alter table rooms add column if not exists has_envelope boolean not null default false;
alter table players add column if not exists last_seen timestamptz default now();

create table if not exists questions(id bigint generated always as identity primary key,room_code text not null references rooms(code) on delete cascade,from_id uuid not null,to_id uuid not null,suspect text not null,weapon text not null,room text not null,answered boolean not null default false,created_at timestamptz default now());
create table if not exists answers(question_id bigint primary key references questions(id) on delete cascade,room_code text not null,asker_id uuid not null,text text not null);

alter table questions enable row level security;
alter table answers enable row level security;
create policy q_read on questions for select to authenticated using(true);
create policy a_read on answers for select to authenticated using(asker_id=auth.uid());

grant select,insert,update,delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter publication supabase_realtime add table questions,answers;
