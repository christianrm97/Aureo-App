-- AUREO — plan personal de cada usuario: presupuesto de proyectos y checkpoint
-- Ejecutar despues de supabase-auth.sql. Idempotente: se puede repetir.
--
-- Todo es opcional (null): un usuario que no los rellena no ve esas tarjetas.
-- Las policies de `perfiles` ya limitan cada fila a su dueño, asi que estas
-- columnas nuevas quedan protegidas sin tocar RLS.

alter table perfiles add column if not exists proyectos_inicial  numeric(12,2);
alter table perfiles add column if not exists proyectos_aporte   numeric(12,2);
alter table perfiles add column if not exists proyectos_tope     numeric(12,2);
alter table perfiles add column if not exists proyectos_inicio   date;
alter table perfiles add column if not exists checkpoint_fecha   date;
alter table perfiles add column if not exists checkpoint_ingreso numeric(12,2);
