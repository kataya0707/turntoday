alter table house_boards
  add column if not exists revision integer not null default 1;

delete from house_members a
where exists (
  select 1 from house_members b
  where a.house_id = b.house_id
    and a.member_id = b.member_id
    and a.created_at > b.created_at
);

create unique index if not exists house_members_house_member_uidx
  on house_members (house_id, member_id);
