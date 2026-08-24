create table if not exists houses (
  id text primary key,
  invite_code text not null unique,
  owner_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists house_members (
  house_id text not null references houses (id) on delete cascade,
  user_id text not null,
  member_id text not null,
  created_at timestamptz not null default now(),
  primary key (house_id, user_id)
);

create unique index if not exists house_members_user_id_uidx
  on house_members (user_id);

create table if not exists house_boards (
  house_id text primary key references houses (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
