-- AUREO — schema Supabase (Postgres)
-- Ejecutar en el SQL Editor del proyecto.

-- ============ GASTOS ============
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  nota text,
  importe numeric(10,2) not null check (importe > 0),
  categoria text not null,
  source text not null default 'web',      -- 'web' | 'shortcut'
  ts bigint not null,                      -- epoch ms (orden y hora en la UI)
  created_at timestamptz default now()
);
create index if not exists gastos_user_ts_idx on gastos (user_id, ts desc);

-- ============ RECURRENTES ============
create table if not exists recurrentes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  nombre text not null,
  importe numeric(10,2) not null,
  tipo text not null,                      -- 'ingreso' | 'gasto' | 'inversion'
  dia int not null check (dia between 1 and 31),
  categoria text,
  icono text,
  desde date,
  hasta date,
  created_at timestamptz default now()
);
create index if not exists recurrentes_user_idx on recurrentes (user_id);

-- ============ CUENTAS (saldos editables desde la app, aun hardcoded) ============
create table if not exists cuentas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  slug text not null,
  nombre text not null,
  subtitulo text,
  saldo numeric(12,2) not null default 0,
  icon text, color text, bg text,
  hub boolean default false,
  inversion boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists cuentas_user_idx on cuentas (user_id);

-- ============ RLS ============
-- Todo el acceso pasa hoy por las rutas /api con la service role key, que
-- ignora RLS. Con RLS activo y sin policies, la anon key no puede leer nada:
-- es lo que queremos hasta que exista auth de verdad.
alter table gastos       enable row level security;
alter table recurrentes  enable row level security;
alter table cuentas      enable row level security;

-- Cuando haya Supabase Auth, descomentar y sustituir user_id por auth.uid():
-- create policy "own_gastos"      on gastos      for all using (auth.uid()::text = user_id);
-- create policy "own_recurrentes" on recurrentes for all using (auth.uid()::text = user_id);
-- create policy "own_cuentas"     on cuentas     for all using (auth.uid()::text = user_id);

-- ============ REALTIME ============
alter publication supabase_realtime add table gastos;
