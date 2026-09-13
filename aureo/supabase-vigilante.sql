-- AUREO — informes del Vigilante de gastos
-- Ejecutar en el SQL Editor. Idempotente: se puede repetir sin romper nada.
--
-- Se guarda el INFORME, nunca el extracto: el CSV del banco se analiza en el
-- navegador y no llega al servidor. El informe es lo que permite comparar con
-- el de la semana siguiente.

create table if not exists vigilante_informes (
  id bigserial primary key,
  user_id text not null,
  desde date not null,
  hasta date not null,
  recurrente_mensual numeric(12,2) not null default 0,
  datos jsonb not null,
  markdown text not null,
  ts bigint not null,
  created_at timestamptz default now()
);

create index if not exists vigilante_user_ts_idx on vigilante_informes (user_id, ts desc);

alter table vigilante_informes enable row level security;
drop policy if exists "propias_select" on vigilante_informes;
drop policy if exists "propias_insert" on vigilante_informes;
drop policy if exists "propias_update" on vigilante_informes;
drop policy if exists "propias_delete" on vigilante_informes;
create policy "propias_select" on vigilante_informes for select using (auth.uid()::text = user_id);
create policy "propias_insert" on vigilante_informes for insert with check (auth.uid()::text = user_id);
create policy "propias_update" on vigilante_informes for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "propias_delete" on vigilante_informes for delete using (auth.uid()::text = user_id);
