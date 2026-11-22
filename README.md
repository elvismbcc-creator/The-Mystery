# THE MYSTERY

Libreta digital multijugador para Clue. Next.js + Tailwind + Supabase (Auth anónima, Postgres, Realtime).

## 1. Configurar Supabase (gratis)
1. Crea un proyecto en https://supabase.com.
2. **Authentication → Providers → Anonymous Sign-Ins**: actívalo.
3. **SQL Editor**: pega y ejecuta `supabase/schema.sql`.
4. **Project Settings → API**: copia `Project URL`, `anon public` y `service_role`.

## 2. Probar en local
```
cp .env.example .env.local   # completa las 3 variables
npm install
npm run dev
```
Para probar con varios celulares, usa tu IP local (http://192.168.x.x:3000) o despliega primero (el QR usa la URL desde la que abriste la app).

## 3. Publicar en internet (Vercel)
1. Sube la carpeta a un repositorio de GitHub.
2. En https://vercel.com → *Add New Project* → importa el repo.
3. En *Environment Variables* agrega las 3 variables de `.env.example`.
4. *Deploy*. Comparte la URL: los jugadores escanean el QR y entran directo a la sala.

## Cómo se juega
- El anfitrión crea la partida, todos entran por QR/enlace, eligen nombre y personaje.
- Al iniciar, el servidor elige la solución secreta, reparte las demás cartas (cada quien ve solo las suyas, marcadas ✓ en su libreta) y nadie puede consultar la solución.
- Una acusación incorrecta elimina al jugador; la correcta termina la partida para todos.

## Seguridad
- `secrets` (la solución) tiene RLS sin políticas: solo las rutas `/api/*` con la `service_role` la leen. Esa clave nunca llega al navegador.
- `notes` y `hands` solo las lee y escribe su dueño (RLS por `auth.uid()`).
- Las acusaciones se validan en el servidor.

Ajuste: `MIN_PLAYERS` en `lib/data.js` (por defecto 2; Clue clásico usa 3).
