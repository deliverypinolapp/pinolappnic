# PinolApp Nicaragua

Aplicación de delivery estilo empresa real para Nicaragua, construida con Next.js 14 + Supabase. Ya dejé integrada tu conexión pública de Supabase para que puedas descomprimir, subir el repositorio y continuar con la base de datos sin tener que buscar dónde pegar las credenciales.

## Qué quedó listo

- Supabase público integrado en el proyecto.
- Configuración de Next.js corregida para que compile.
- Build verificado correctamente en entorno local.
- Archivo `.env.local` incluido dentro del zip listo para usar.
- `.env.local.example` actualizado con tu proyecto.
- Metadata y branding base ajustados para una entrega más profesional.

## Credenciales ya conectadas

```env
NEXT_PUBLIC_SUPABASE_URL=https://mdsfnuihjymxqvkunokd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_WGRy0GgFnfsfJu8ptx0Hcw_rl5r1sxh
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Importante sobre la base de datos

Para que la app funcione completa todavía tienes que ejecutar el esquema SQL en tu proyecto Supabase:

- Abre Supabase.
- Entra en **SQL Editor**.
- Ejecuta el archivo `supabase/migrations/001_schema.sql`.

Sin ese paso, la interfaz compila pero no tendrá tablas, políticas ni datos.

## Cómo arrancarlo

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Subir a GitHub

```bash
git init
git add .
git commit -m "feat: pinolapp lista para despliegue"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/pinolappnic.git
git push -u origin main
```

## Despliegue recomendado

La forma más práctica es:

1. Subir a GitHub.
2. Importar el repo en Vercel.
3. En Vercel definir estas variables si luego quieres administrarlas desde panel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`

## ¿Se puede usar con Termux en móvil?

Sí, **para pruebas**. Pero para un proyecto de empresa real no es lo ideal como entorno principal.

### En Termux podrías intentar:

```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
npm install
npm run dev
```

### Lo recomendable para producción

- Desarrollo en PC o portátil
- Repositorio en GitHub
- Despliegue en Vercel
- Base de datos en Supabase

## Archivos que toqué

- `next.config.mjs`
- `src/lib/supabase/config.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `middleware.ts`
- `.env.local.example`
- `README.md`
- `.env.local`

## Estado final

El proyecto quedó compilando correctamente y preparado para que lo subas a GitHub y sigas con el despliegue.
