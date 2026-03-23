alter table public.marcaje_personal
  add column if not exists hora_entrada timestamp,
  add column if not exists hora_salida timestamp,
  add column if not exists estado_entrada text;
