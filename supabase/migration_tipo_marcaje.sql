alter table public.marcaje_personal
add column if not exists tipo_marcaje text;

update public.marcaje_personal
set tipo_marcaje = coalesce(tipo_marcaje, 'entrada')
where tipo_marcaje is null;

alter table public.marcaje_personal
alter column tipo_marcaje set default 'entrada';

alter table public.marcaje_personal
alter column tipo_marcaje set not null;

alter table public.marcaje_personal
add constraint marcaje_personal_tipo_marcaje_check
check (tipo_marcaje in ('entrada', 'salida'));

create unique index if not exists marcaje_personal_unico_persona_fecha_bloque_tipo_idx
on public.marcaje_personal (nombre, rol, fecha, bloque, tipo_marcaje);
