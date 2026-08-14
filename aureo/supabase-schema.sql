-- AUREO — schema Supabase (Postgres)
-- Ejecutar en el SQL Editor del proyecto. Es idempotente: se puede repetir.

-- ============ LIMPIEZA SEGURA ============
-- Si una tabla existe con una forma antigua, se recrea SOLO si esta vacia.
-- Con datos dentro no se toca: el script fallara mas abajo y habra que migrar
-- a mano, que es justo lo que queremos antes de perder gastos.
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array['gastos', 'recurrentes', 'cuentas', 'suscripciones', 'recibos', 'deudas'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from %I', t) into n;
      if n = 0 then
        execute format('drop table %I cascade', t);
        raise notice 'Tabla % vacia: recreada', t;
      else
        raise notice 'Tabla % con % filas: se conserva', t, n;
      end if;
    end if;
  end loop;
end $$;

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

-- ============ SUSCRIPCIONES ============
create table if not exists suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  plataforma text not null,               -- id del catalogo (lib/catalogo.ts)
  nombre text not null,
  plan text not null,
  cuota numeric(10,2) not null check (cuota > 0),
  dia int not null default 1 check (dia between 1 and 31),
  activa boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists suscripciones_user_idx on suscripciones (user_id);

-- ============ RECIBOS DOMICILIADOS ============
create table if not exists recibos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tipo text not null,                     -- luz | agua | gas | internet | movil | ibi | ...
  nombre text not null,
  companyia text,
  importe numeric(10,2) not null check (importe > 0),
  dia int not null default 1 check (dia between 1 and 31),
  periodicidad text not null default 'mensual',
  activo boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists recibos_user_idx on recibos (user_id);

-- ============ DEUDA ============
create table if not exists deudas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tipo text not null,                     -- prestamo | hipoteca | financiacion | tarjeta | aplazado | familiar
  nombre text not null,
  entidad text,
  pendiente numeric(12,2) not null check (pendiente > 0),
  cuota numeric(10,2) not null check (cuota > 0),
  dia int not null default 1 check (dia between 1 and 31),
  tae numeric(5,2),
  meses_restantes int,
  created_at timestamptz default now()
);
create index if not exists deudas_user_idx on deudas (user_id);

-- Los recurrentes fijos (nomina, prestamo, IRPF, transferencias) los sirve la
-- app desde lib/recurrentes.ts cuando la tabla esta vacia. La tabla solo
-- guarda los que crees tu, asi que dejarla vacia es el estado correcto.
truncate table recurrentes;

-- ============ RLS ============
-- Todo el acceso pasa hoy por las rutas /api con la service role key, que
-- ignora RLS. Con RLS activo y sin policies, la anon key no puede leer nada:
-- es lo que queremos hasta que exista auth de verdad.
alter table gastos       enable row level security;
alter table recurrentes  enable row level security;
alter table cuentas      enable row level security;
alter table suscripciones enable row level security;
alter table recibos      enable row level security;
alter table deudas       enable row level security;


-- Cuando haya Supabase Auth, descomentar y sustituir user_id por auth.uid():
-- create policy "own_gastos"      on gastos      for all using (auth.uid()::text = user_id);
-- create policy "own_recurrentes" on recurrentes for all using (auth.uid()::text = user_id);
-- create policy "own_cuentas"     on cuentas     for all using (auth.uid()::text = user_id);
