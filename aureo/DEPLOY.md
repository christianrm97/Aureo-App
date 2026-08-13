# 🚀 DEPLOY AIRE — De cero a vivo en 30 minutos

## PASO 1 — Crear proyecto en Supabase (5 min)

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `aureo-finanzas`
3. Contraseña: crea una y guárdala
4. Región: **West EU (Ireland)** — más cerca de España
5. Espera ~2 min a que se cree

## PASO 2 — Ejecutar el Schema SQL (2 min)

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Haz clic en **New query**
3. Pega el contenido de `supabase-schema.sql`
4. Haz clic en **Run** (▶)
5. Deberías ver: "Success. No rows returned"

## PASO 3 — Obtener tus Keys (1 min)

En Supabase → **Settings → API**:
- Copia `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
- Copia `anon public` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copia `service_role secret` → será `SUPABASE_SERVICE_ROLE_KEY`

## PASO 4 — Subir código a GitHub (3 min)

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "feat: Aureo v1 — primer commit"
git remote add origin https://github.com/christianrm97/aureo-finanzas.git
git push -u origin main
```

## PASO 5 — Conectar a Vercel (3 min)

1. Ve a [vercel.com/aureo-team](https://vercel.com/aureo-team) (ya tienes la cuenta)
2. **Add New → Project**
3. Selecciona el repo `aureo-finanzas` de GitHub
4. Framework: **Next.js** (lo detecta solo)
5. **NO hagas deploy todavía** — primero configura las variables

## PASO 6 — Variables de entorno en Vercel (2 min)

En Vercel → tu proyecto → **Settings → Environment Variables**:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (SECRETO) |
| `SHORTCUT_SECRET` | Genera uno: escribe en terminal `openssl rand -hex 16` |

## PASO 7 — Deploy (1 min)

1. En Vercel → **Deploy**
2. Espera ~2 min
3. Tu app estará en: `aureo-finanzas.vercel.app`

## PASO 8 — Crear tu usuario (2 min)

1. Ve a Supabase → **Authentication → Users → Add user**
2. Email: el tuyo
3. Password: la que quieras
4. Guarda el `User ID` (UUID) — lo necesitarás para el atajo

## PASO 9 — Insertar datos iniciales (3 min)

En Supabase → **SQL Editor** → ejecuta:

```sql
-- Reemplaza '<tu-user-id>' con el UUID de tu usuario
INSERT INTO cuentas (user_id, nombre, tipo, saldo, color, icono) VALUES
  ('<tu-user-id>', 'OpenBank', 'banco', 1539, '#4a9eff', '🏦'),
  ('<tu-user-id>', 'Santander Principal', 'banco', 200, '#e53e3e', '🏛️'),
  ('<tu-user-id>', 'Santander Conjunta', 'banco', 150, '#805ad5', '👫'),
  ('<tu-user-id>', 'Bleap', 'banco', 106.71, '#00c896', '💳'),
  ('<tu-user-id>', 'Cajamar', 'banco', 100, '#ed8936', '🌾'),
  ('<tu-user-id>', 'MyInvestor S&P 500', 'inversion', 136, '#00c896', '📈');

INSERT INTO plan_config (user_id, nomina, bleap_mensual, cuenta_pareja_mensual, myinvestor_mensual)
VALUES ('<tu-user-id>', 1410.67, 90, 150, 80);

INSERT INTO recurrentes (user_id, nombre, importe, tipo, dia_cargo, periodicidad, color) VALUES
  ('<tu-user-id>', 'IRPF cuota', 280.90, 'irpf', 5, 'mensual', '#ffc542'),
  ('<tu-user-id>', 'Préstamo padres', 686, 'prestamo', 26, 'mensual', '#ff4d6a'),
  ('<tu-user-id>', 'Netflix', 17.99, 'suscripcion', 15, 'mensual', '#4a9eff'),
  ('<tu-user-id>', 'Spotify', 11.99, 'suscripcion', 12, 'mensual', '#1ed760'),
  ('<tu-user-id>', 'Claude Pro', 18, 'suscripcion', 1, 'mensual', '#d97706'),
  ('<tu-user-id>', 'DIGI', 10, 'recibo', 15, 'mensual', '#ed8936'),
  ('<tu-user-id>', 'Club del Libro', 10.26, 'suscripcion', 10, 'mensual', '#8b5cf6'),
  ('<tu-user-id>', 'Simyo', 3.50, 'recibo', 10, 'mensual', '#6366f1'),
  ('<tu-user-id>', 'AECC', 5, 'recibo', 5, 'mensual', '#10b981'),
  ('<tu-user-id>', 'Agua Patronato', 26.85, 'recibo', 1, 'trimestral', '#38bdf8');
```

## PASO 10 — Atajo iPhone (5 min)

### En iPhone → Accesos Directos → Nuevo atajo:

1. **Acción 1:** "Preguntar número" → Texto: `¿Cuánto gastas?` → Variable: **Importe**

2. **Acción 2:** "Elegir del menú"
   - Opción 1: `Bleap` → Variable: **Categoria**
   - Opción 2: `Cuenta Pareja` → Variable: **Categoria**
   - Opción 3: `Efectivo` → Variable: **Categoria**
   - Opción 4: `Suscripción` → Variable: **Categoria**
   - Opción 5: `Recibo` → Variable: **Categoria**

3. **Acción 3:** "Preguntar" → Texto: `¿En qué lo gastaste?` → Variable: **Nota**

4. **Acción 4:** "URL" → Escribe:
   ```
   https://aureo-finanzas.vercel.app/api/gastos
   ```

5. **Acción 5:** "Obtener contenido de URL"
   - Método: **POST**
   - Cabeceras:
     - `Content-Type`: `application/json`
     - `Authorization`: `Bearer TU_SHORTCUT_SECRET` (el que pusiste en Vercel)
   - Cuerpo (JSON):
     ```json
     {
       "nota": "Nota",
       "importe": "Importe",
       "categoria": "Categoria",
       "user_id": "TU_UUID_DE_SUPABASE"
     }
     ```
     (Cada valor en comillas es la Variable que creaste antes)

6. **Acción 6:** "Mostrar alerta"
   - Título: `✅ Gasto registrado`
   - Mensaje: `Resultado del contenido de URL` (variable del paso 5)

7. **Nombra el atajo:** `💸 Gasto Aureo`

8. **Añade a pantalla de inicio** o úsalo desde el widget de Accesos Directos

---

## ✅ Resultado Final

- **App:** `https://aureo-finanzas.vercel.app`
- **API:** `https://aureo-finanzas.vercel.app/api/gastos`
- **Precios en vivo:** `https://aureo-finanzas.vercel.app/api/precios?tickers=CSPX`
- **Atajo:** Un tap → Importe → Categoría → Descripción → se actualiza en tiempo real

## 🔄 Flujo completo

```
iPhone (Atajo)
   ↓ POST /api/gastos (con Bearer token)
Vercel Edge Function
   ↓ INSERT INTO gastos
Supabase Postgres
   ↓ Realtime subscription (WebSocket)
Aureo App (browser)
   ↓ UI se actualiza automáticamente
```

## 🐛 Problemas comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token incorrecto | Revisa SHORTCUT_SECRET en Vercel |
| 422 Unprocessable | Faltan campos | Revisa que el JSON tiene nota/importe/categoria/user_id |
| 500 Server Error | Supabase caído o mal configurado | Revisa SUPABASE_SERVICE_ROLE_KEY |
| No se actualiza en tiempo real | Realtime no activado | Ejecuta el último bloque del schema SQL |
