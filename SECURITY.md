# Seguridad

Aureo gestiona datos financieros. Nos tomamos en serio cualquier fallo que pueda exponerlos.

## Informar de una vulnerabilidad

**No abras un issue público.** Un fallo publicado antes de corregirse pone en riesgo a todos los usuarios.

Escribe a **aureo.app@outlook.com** con:

- Qué has encontrado y dónde (ruta, archivo o pantalla).
- Los pasos para reproducirlo.
- El impacto que crees que tiene.

Te responderemos lo antes posible y te avisaremos cuando esté corregido. Si quieres, te citaremos en la corrección.

Por favor, no accedas a datos de otros usuarios, no los modifiques ni los borres para demostrar el fallo: con explicar cómo podría hacerse es suficiente.

## Cómo protege Aureo los datos

- **Aislamiento por usuario en la base de datos.** Todas las tablas tienen Row Level Security: Postgres impide leer o escribir filas de otro usuario, aunque el código de la app tuviera un fallo.
- **La clave de servicio nunca llega al navegador.** Solo la usan el Atajo de iPhone (que se identifica con un token personal) y el borrado de cuenta.
- **Los extractos bancarios no salen del dispositivo.** El CSV se analiza en el navegador; al servidor solo llega el informe, y solo si el usuario lo guarda.
- **Sin credenciales bancarias.** Aureo no se conecta a ningún banco.
- **Límite de peticiones** en las escrituras, en el endpoint del Atajo y en las rutas públicas.
- **Cabeceras de seguridad:** HSTS, `nosniff`, protección contra marcos y Permissions-Policy.

## Si despliegas tu propia copia

- Nunca subas archivos `.env*` al repositorio (ya están en `.gitignore`).
- `SUPABASE_SERVICE_ROLE_KEY` **jamás** debe llevar el prefijo `NEXT_PUBLIC_`: se incrustaría en el JavaScript público y cualquiera podría saltarse la seguridad.
- Ejecuta **todos** los archivos SQL. Sin las políticas de RLS, cualquier usuario autenticado podría leer los datos del resto.
- Configura tus propios datos de responsable con las variables `NEXT_PUBLIC_LEGAL_*`.
