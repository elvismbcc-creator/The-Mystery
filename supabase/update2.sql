alter table rooms add column if not exists started_at timestamptz;
alter table rooms add column if not exists finished_at timestamptz;
alter table players add column if not exists eliminated_at timestamptz;
alter table players add column if not exists wins int not null default 0;
