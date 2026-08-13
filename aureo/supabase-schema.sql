-- ============================================================
-- AIRE — Schema Supabase
-- Pega esto en SQL Editor de tu proyecto Supabase y ejecuta
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- USUARIOS (gestionado por Supabase Auth, solo extendemos)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nombre text,
  avatar_url text,
  pareja_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- CUENTAS BANCARIAS
-- ============================================================
create table if not exists public.cuentas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  nombre text not null,           -- "Santander Principal", "OpenBank", etc.
  tipo text not null,             -- 'banco' | 'inversion' | 'cripto' | 'efectivo'
  saldo numeric(12,2) default 0,
  color text default '#10b981',   -- color visual en la app
  icono text,                     -- emoji o nombre de icono
  compartida boolean default false, -- cuenta compartida con pareja
  activa boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Insertar cuentas iniciales de Christian
-- (ejecutar después de crear tu usuario)
-- insert into cuentas (user_id, nombre, tipo, saldo, color) values
--   ('<tu-user-id>', 'Santander Principal', 'banco', 200, '#e53e3e'),
--   ('<tu-user-id>', 'OpenBank', 'banco', 1539, '#3182ce'),
--   ('<tu-user-id>', 'Santander Conjunta', 'banco', 150, '#805ad5'),
--   ('<tu-user-id>', 'Bleap', 'banco', 106.71, '#00d9ff'),
--   ('<tu-user-id>', 'Cajamar', 'banco', 100, '#ed8936'),
--   ('<tu-user-id>', 'MyInvestor S&P 500', 'inversion', 136, '#10b981');

-- ============================================================
-- GASTOS
-- ============================================================
create table if not exists public.gastos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  nota text not null,
  importe numeric(10,2) not null,
  categoria text not null,        -- 'Bleap' | 'Cuenta Pareja' | 'Efectivo' | 'Suscripción' | 'Recibo'
  cuenta_id uuid references public.cuentas(id),
  fecha timestamptz default now(),
  desde_atajo boolean default false -- si vino del iPhone Shortcut
);

-- ============================================================
-- INVERSIONES (activos)
-- ============================================================
create table if not exists public.inversiones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  nombre text not null,           -- "MyInvestor S&P 500"
  ticker text,                    -- "CSPX", "BTC-USD", etc.
  tipo text not null,             -- 'fondo' | 'etf' | 'accion' | 'cripto' | 'inmueble'
  cantidad numeric(18,8) default 1, -- participaciones / unidades
  precio_compra numeric(12,4),
  aportacion_mensual numeric(10,2) default 0,
  activa boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- SUSCRIPCIONES Y RECIBOS
-- ============================================================
create table if not exists public.recurrentes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  nombre text not null,           -- "Netflix", "Agua Patronato", "IBI"
  importe numeric(10,2) not null,
  tipo text not null,             -- 'suscripcion' | 'recibo' | 'prestamo' | 'irpf'
  periodicidad text default 'mensual', -- 'mensual' | 'trimestral' | 'anual' | 'unica'
  dia_cargo int,                  -- día del mes que se cobra
  cuenta_id uuid references public.cuentas(id),
  activa boolean default true,
  proxima_fecha date,
  icono text,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- ============================================================
-- OBJETIVOS / PROYECCIÓN
-- ============================================================
create table if not exists public.objetivos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  nombre text not null,
  importe_objetivo numeric(12,2),
  fecha_objetivo date,
  notas text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- CONFIGURACIÓN DEL PLAN (parámetros del plan C)
-- ============================================================
create table if not exists public.plan_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  nomina numeric(10,2) default 1410.67,
  dia_nomina int default 28,
  bleap_mensual numeric(10,2) default 90,
  cuenta_pareja_mensual numeric(10,2) default 150,
  myinvestor_mensual numeric(10,2) default 80,
  floor_santander numeric(10,2) default 200,
  floor_openbank numeric(10,2) default 1539,
  updated_at timestamptz default now()
);

-- ============================================================
-- HISTORIAL DE SALDOS (snapshot mensual)
-- ============================================================
create table if not exists public.historial_saldos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  fecha date not null,
  saldo_total numeric(12,2),
  saldo_liquido numeric(12,2),
  saldo_inversion numeric(12,2),
  detalles jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- SEGURIDAD: Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.cuentas enable row level security;
alter table public.gastos enable row level security;
alter table public.inversiones enable row level security;
alter table public.recurrentes enable row level security;
alter table public.objetivos enable row level security;
alter table public.plan_config enable row level security;
alter table public.historial_saldos enable row level security;

-- Políticas: cada usuario solo ve sus datos
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);
create policy "cuentas_own" on public.cuentas for all using (auth.uid() = user_id);
create policy "gastos_own" on public.gastos for all using (auth.uid() = user_id);
create policy "inversiones_own" on public.inversiones for all using (auth.uid() = user_id);
create policy "recurrentes_own" on public.recurrentes for all using (auth.uid() = user_id);
create policy "objetivos_own" on public.objetivos for all using (auth.uid() = user_id);
create policy "plan_config_own" on public.plan_config for all using (auth.uid() = user_id);
create policy "historial_own" on public.historial_saldos for all using (auth.uid() = user_id);

-- API pública para el atajo iPhone (usa service_role key, no anon)
-- La API Route de Next.js usa SUPABASE_SERVICE_ROLE_KEY para bypassear RLS

-- ============================================================
-- REALTIME: habilitar tablas para subscripciones en tiempo real
-- ============================================================
alter publication supabase_realtime add table public.gastos;
alter publication supabase_realtime add table public.cuentas;
alter publication supabase_realtime add table public.inversiones;
