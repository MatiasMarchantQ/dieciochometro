# Dieciochómetro

Contador de comida y bebida para el 18 de septiembre, con cuentas de usuario,
imagen compartible a Instagram, panel de vidrio 3D y temas estacionales
(claro/oscuro/Halloween/Navidad).

- `client/` — React + Vite + Three.js
- `server/` — Express + libSQL (SQLite localmente, Turso en producción/Vercel)

## Desarrollo local

```bash
cd server && npm install && npm run dev   # API en :3001 (usa un archivo .db local)
cd client && npm install && npm run dev   # Vite en :5173
```

Copia `server/.env.example` a `server/.env` y define al menos `JWT_SECRET`.
Sin `TURSO_DATABASE_URL`, el servidor usa automáticamente un archivo SQLite
local (`server/dieciochometro.db`) — no necesitas Turso para desarrollar.

## Desplegar en Vercel

Vercel no soporta servidores tradicionales con disco persistente, así que la
base de datos vive en [Turso](https://turso.tech) (mismo dialecto SQLite).

1. **Crear la base de datos en Turso** (~2 minutos, cuenta gratis):
   - Entra a [dashboard.turso.tech](https://dashboard.turso.tech) y crea una base de datos.
   - Copia la **Database URL** (empieza con `libsql://...`) y crea un **Auth Token**.

2. **Importar el repo en Vercel**:
   - [vercel.com/new](https://vercel.com/new) → importa este repositorio de GitHub.
   - Vercel debería detectar `vercel.json` automáticamente (build del cliente +
     función serverless para la API). No hace falta tocar la configuración del
     proyecto.

3. **Variables de entorno** (Project Settings → Environment Variables):
   - `JWT_SECRET` — cualquier string largo y aleatorio.
   - `TURSO_DATABASE_URL` — la que copiaste en el paso 1.
   - `TURSO_AUTH_TOKEN` — el token que generaste en el paso 1.

4. Redeploy. Las tablas se crean solas la primera vez que la función corre.
