create extension if not exists "pgcrypto";

create type public.user_role as enum ('employee', 'manager', 'admin');
create type public.request_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'New employee',
  role public.user_role not null default 'employee',
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  category text not null,
  total_stock integer not null check (total_stock >= 0),
  available_stock integer not null check (available_stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_available_lte_total check (available_stock <= total_stock)
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.inventory(id) on delete restrict,
  status public.request_status not null default 'pending',
  quantity integer not null check (quantity > 0),
  attachment_path text not null,
  rejection_reason text,
  processed_by uuid references public.profiles(id),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pending_requests_are_unprocessed check (
    (status = 'pending' and processed_by is null and processed_at is null)
    or (status in ('approved', 'rejected') and processed_by is not null and processed_at is not null)
  )
);

create index requests_employee_id_idx on public.requests(employee_id);
create index requests_item_id_idx on public.requests(item_id);
create index requests_status_created_at_idx on public.requests(status, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventory_touch_updated_at
before update on public.inventory
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'New employee'),
    'employee'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('manager', 'admin'), false);
$$;

create or replace function public.email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.email_exists(text) from public;
grant execute on function public.email_exists(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
alter table public.requests enable row level security;

create policy "profiles_select_own_or_staff"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_staff());

create policy "profiles_update_self_name"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy "profiles_admin_update_roles"
on public.profiles for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "inventory_read_authenticated"
on public.inventory for select
to authenticated
using (true);

create policy "inventory_staff_insert"
on public.inventory for insert
to authenticated
with check (public.is_staff());

create policy "inventory_staff_update"
on public.inventory for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "inventory_admin_delete"
on public.inventory for delete
to authenticated
using (public.current_user_role() = 'admin');

create policy "requests_select_owner_or_staff"
on public.requests for select
to authenticated
using (employee_id = auth.uid() or public.is_staff());

create policy "requests_insert_own_pending"
on public.requests for insert
to authenticated
with check (
  employee_id = auth.uid()
  and status = 'pending'
  and processed_by is null
  and processed_at is null
  and attachment_path like ('receipts/' || auth.uid()::text || '/%')
);

create or replace function public.process_item_request(
  p_request_id uuid,
  p_approve boolean,
  p_rejection_reason text default null
)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_request public.requests;
  v_inventory public.inventory;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid();

  if v_role not in ('manager', 'admin') then
    raise exception 'Only managers and admins can process requests'
      using errcode = '42501';
  end if;

  select *
  into v_request
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found'
      using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request has already been processed'
      using errcode = 'P0001';
  end if;

  if p_approve then
    select *
    into v_inventory
    from public.inventory
    where id = v_request.item_id
    for update;

    if not found then
      raise exception 'Inventory item not found'
        using errcode = 'P0002';
    end if;

    if v_inventory.available_stock < v_request.quantity then
      raise exception 'Insufficient stock: requested %, available %',
        v_request.quantity,
        v_inventory.available_stock
        using errcode = 'P0001';
    end if;

    update public.inventory
    set available_stock = available_stock - v_request.quantity
    where id = v_request.item_id;

    update public.requests
    set status = 'approved',
        rejection_reason = null,
        processed_by = auth.uid(),
        processed_at = now()
    where id = p_request_id
    returning * into v_request;
  else
    if nullif(trim(coalesce(p_rejection_reason, '')), '') is null then
      raise exception 'Rejection reason is required'
        using errcode = 'P0001';
    end if;

    update public.requests
    set status = 'rejected',
        rejection_reason = trim(p_rejection_reason),
        processed_by = auth.uid(),
        processed_at = now()
    where id = p_request_id
    returning * into v_request;
  end if;

  return v_request;
end;
$$;

revoke all on function public.process_item_request(uuid, boolean, text) from public;
grant execute on function public.process_item_request(uuid, boolean, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-receipts',
  'request-receipts',
  false,
  5242880,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "receipts_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'request-receipts'
  and split_part(name, '/', 1) = 'receipts'
  and split_part(name, '/', 2) = auth.uid()::text
);

create policy "receipts_select_own_or_staff"
on storage.objects for select
to authenticated
using (
  bucket_id = 'request-receipts'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or public.is_staff()
  )
);

create policy "receipts_delete_own_pending_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'request-receipts'
  and (
    public.current_user_role() = 'admin'
    or (
      split_part(name, '/', 2) = auth.uid()::text
      and exists (
        select 1
        from public.requests r
        where r.attachment_path = storage.objects.name
          and r.employee_id = auth.uid()
          and r.status = 'pending'
      )
    )
  )
);
