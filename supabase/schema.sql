create table rooms(code text primary key,host_id uuid not null,status text not null default 'lobby',winner_name text,solution jsonb,last_event jsonb,created_at timestamptz default now());
create table players(id uuid not null,room_code text not null references rooms(code) on delete cascade,name text not null check(char_length(name) between 1 and 20),character text not null,eliminated boolean not null default false,joined_at timestamptz default now(),primary key(room_code,id),unique(room_code,character));
create table notes(room_code text not null,player_id uuid not null,data jsonb not null default '{}',primary key(room_code,player_id),foreign key(room_code,player_id) references players(room_code,id) on delete cascade);
create table hands(room_code text not null,player_id uuid not null,cards jsonb not null,primary key(room_code,player_id),foreign key(room_code,player_id) references players(room_code,id) on delete cascade);
create table secrets(room_code text primary key references rooms(code) on delete cascade,suspect text not null,weapon text not null,room text not null);

alter table rooms enable row level security;alter table players enable row level security;
alter table notes enable row level security;alter table hands enable row level security;
alter table secrets enable row level security; -- sin políticas: solo el servidor (service role) puede leerla

create policy rooms_read on rooms for select to authenticated using(true);
create policy rooms_insert on rooms for insert to authenticated with check(host_id=auth.uid());
create policy players_read on players for select to authenticated using(true);
create policy players_insert on players for insert to authenticated with check(id=auth.uid() and exists(select 1 from rooms r where r.code=room_code and r.status='lobby'));
create policy notes_own on notes for all to authenticated using(player_id=auth.uid()) with check(player_id=auth.uid());
create policy hands_own on hands for select to authenticated using(player_id=auth.uid());

alter publication supabase_realtime add table rooms,players;
