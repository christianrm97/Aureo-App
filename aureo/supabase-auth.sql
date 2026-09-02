-- AUREO — multiusuario con Google OAuth
-- Ejecutar en el SQL Editor DESPUES de haber creado ya las tablas de datos.
-- Es idempotente: se puede repetir sin romper nada.

-- ============ PERFIL POR USUARIO ============
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  objetivo numeric(12,2) not null default 1500,
  fondo_emergencia numeric(12,2) not null default 1500,
  fecha_objetivo date,
  -- Token del Atajo de iPhone: identifica al usuario sin sesion de navegador
  shortcut_token text unique not null,
  created_at timestamptz default now()
);
create index if not exists perfiles_token_idx on perfiles (shortcut_token);

-- ============ AISLAMIENTO POR USUARIO ============
-- Las tablas guardan user_id como texto y auth.uid() es uuid: se compara
-- convirtiendo. Sin esta conversion la policy no casa nunca y no se ve nada.
do $$
declare
  t text;
begin
  foreach t in array array['gastos', 'recurrentes', 'cuentas', 'suscripciones', 'recibos', 'deudas', 'ingresos'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabla % no existe todavia, se salta', t;
      continue;
    end if;

    execute format('alter table %I enable row level security', t);
    -- Se recrean para que repetir el script no falle por duplicado
    execute format('drop policy if exists "propias_select" on %I', t);
    execute format('drop policy if exists "propias_insert" on %I', t);
    execute format('drop policy if exists "propias_update" on %I', t);
    execute format('drop policy if exists "propias_delete" on %I', t);

    execute format('create policy "propias_select" on %I for select using (auth.uid()::text = user_id)', t);
    -- with check en el insert: impide crear filas a nombre de otro usuario
    execute format('create policy "propias_insert" on %I for insert with check (auth.uid()::text = user_id)', t);
    execute format('create policy "propias_update" on %I for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id)', t);
    execute format('create policy "propias_delete" on %I for delete using (auth.uid()::text = user_id)', t);

    raise notice 'RLS activo en %', t;
  end loop;
end $$;

-- El perfil se compara por id, no por user_id
alter table perfiles enable row level security;
drop policy if exists "perfil_propio_select" on perfiles;
drop policy if exists "perfil_propio_insert" on perfiles;
drop policy if exists "perfil_propio_update" on perfiles;
create policy "perfil_propio_select" on perfiles for select using (auth.uid() = id);
create policy "perfil_propio_insert" on perfiles for insert with check (auth.uid() = id);
create policy "perfil_propio_update" on perfiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============ RECLAMAR LOS DATOS ANTIGUOS ============
-- Todo lo creado antes del login vive con user_id = 'christian'. Ejecuta esto
-- UNA VEZ, despues de tu primer inicio de sesion con Google, para pasarlo a tu
-- cuenta. Cambia el correo si entras con otro.
--
-- do $$
-- declare
--   uid uuid;
--   t text;
-- begin
--   select id into uid from auth.users where email = 'cruizm9@gmail.com';
--   if uid is null then
--     raise exception 'Ese correo aun no ha iniciado sesion';
--   end if;
--   foreach t in array array['gastos','recurrentes','cuentas','suscripciones','recibos','deudas','ingresos'] loop
--     execute format('update %I set user_id = %L where user_id = %L', t, uid::text, 'christian');
--   end loop;
-- end $$;
