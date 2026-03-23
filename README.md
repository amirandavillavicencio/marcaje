# Marcaje CIAC

Proyecto estático simple para registrar asistencia de administradores y tutores usando Supabase.

## Antes de subir a GitHub

1. Abre `app.js`.
2. Reemplaza:
   - `REEMPLAZAR_CON_TU_SUPABASE_URL`
   - `REEMPLAZAR_CON_TU_SUPABASE_ANON_KEY`
3. Verifica que tu tabla en Supabase se llame `marcaje_personal`.
4. Verifica que tengas activadas las policies de `select` e `insert` para `anon`.

## Archivos

- `index.html`: interfaz principal
- `styles.css`: estilos
- `app.js`: lógica de conexión y registros

## Deploy

Puedes subir esta carpeta a GitHub y luego importarla en Vercel como proyecto estático.
