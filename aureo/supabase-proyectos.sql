-- AUREO — movimientos de proyectos
-- Ejecutar en el SQL Editor. Idempotente: se puede repetir sin romper nada.
--
-- Una fila = un movimiento, no un proyecto. Asi el consumo del mes, la
-- inversion acumulada y el ROI salen de sumar, sin una segunda tabla.

create table if not exists proyectos (
  id bigserial primary key,
  user_id text not null,
  -- Id del catalogo: livasonic, bot, padelito, otro
  proyecto text not null,
  -- 'inversion' resta del presupuesto, 'ingreso' cuenta para el checkpoint
  tipo text not null check (tipo in ('inversion', 'ingreso')),
  concepto text not null,
  importe numeric(12,2) not null check (importe > 0),
  ts bigint not null,
  created_at timestamptz default now()
);

create index if not exists proyectos_user_ts_idx on proyectos (user_id, ts desc);

alter table proyectos enable row level security;
drop policy if exists "propias_select" on proyectos;
drop policy if exists "propias_insert" on proyectos;
drop policy if exists "propias_update" on proyectos;
drop policy if exists "propias_delete" on proyectos;
create policy "propias_select" on proyectos for select using (auth.uid()::text = user_id);
create policy "propias_insert" on proyectos for insert with check (auth.uid()::text = user_id);
create policy "propias_update" on proyectos for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "propias_delete" on proyectos for delete using (auth.uid()::text = user_id);
