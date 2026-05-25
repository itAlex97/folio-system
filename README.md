# Folio System

Sistema interno para registrar, consultar y administrar folios de cambios de ingenieria. El proyecto esta dividido en un backend ASP.NET Core con SQL Server y un frontend React/Vite.

## Estado Actual

MVP funcional para demo o uso interno controlado:

- Login con usuarios activos.
- Autenticacion JWT con Bearer tokens.
- Roles operativos: `LEADER`, `ENGINEER`, `DRAFTER`.
- Permiso administrativo separado con `Users.IsAdmin`.
- Listado, busqueda, filtros y ordenamiento de documentos.
- Creacion y edicion de documentos `BCN`, `DCN` y `DFM`.
- Cierre y cancelacion de documentos abiertos segun permisos.
- Reapertura solo de documentos `CANCELLED` por admin o leader.
- Panel admin con metricas.
- Admin Users con edicion en modal.
- Admin Catalogs con cards, tablas, add/edit en modal y filtro de familias por programa.
- UI con paleta neutral, acento rojo corporativo e iconografia `lucide-react`.

No esta listo como produccion abierta todavia. Las principales deudas restantes son quitar fallback de password plano, auditoria persistente, pruebas automatizadas y hardening de seguridad.

## Stack

Backend:

- ASP.NET Core / Minimal APIs
- .NET `net10.0`
- Entity Framework Core SQL Server
- SQL Server Express/local

Frontend:

- React 19
- TypeScript
- Vite
- React Router
- Lucide React
- CSS global en `frontend/src/index.css`

## Estructura

```text
folio-system/
  backend/
    Contracts/        DTOs de API
    Data/             DbContext y mapeo EF
    Models/           Entidades SQL
    Program.cs        Endpoints y reglas de negocio
  frontend/
    src/
      api/            Cliente fetch comun
      auth/           Estado de sesion en frontend
      components/     Layout, botones, dialogos, documentos
      hooks/          Hooks para documentos y opciones
      pages/          Pantallas principales
      routes/         Rutas protegidas
      services/       Servicios HTTP
      types/          Tipos TypeScript
  scripts/
    create-folio-db.sql
    seed-folio-db.sql
    old/
  folio-system.sln
  README.md
```

## Configuracion Local

### Base de datos

La cadena de conexion esta en:

- `backend/appsettings.json`
- `backend/appsettings.Development.json`

Valor local actual:

```text
Data Source=.\SQLEXPRESS;Initial Catalog=FolioDB;Integrated Security=True;TrustServerCertificate=True
```

Scripts actuales:

- `scripts/create-folio-db.sql`: crea base, tablas, relaciones y stored procedure `GenerateEngineeringFolio`.
- `scripts/seed-folio-db.sql`: carga programas, tipos, DREs, car leaders, familias y usuarios.
- `scripts/old/`: scripts historicos conservados como referencia.

Nota: `Users.Role` representa el rol operativo. `Users.IsAdmin` controla acceso al panel y endpoints admin.

### Backend

```powershell
cd backend
$env:DOTNET_CLI_HOME='c:\projects\folio-system\backend'
dotnet restore
dotnet build
dotnet run --urls http://localhost:5052
```

Endpoints principales:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/engineering-changes`
- `GET /api/engineering-changes/{id}`
- `POST /api/engineering-changes`
- `PATCH /api/engineering-changes/{id}`
- `PATCH /api/engineering-changes/{id}/close`
- `PATCH /api/engineering-changes/{id}/cancel`
- `PATCH /api/engineering-changes/{id}/reopen`
- `GET /api/document-form-options`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}`
- `GET /api/admin/catalogs`
- `POST /api/admin/programs`
- `PATCH /api/admin/programs/{code}`
- `POST /api/admin/document-types`
- `PATCH /api/admin/document-types/{code}`
- `POST /api/admin/families`
- `PATCH /api/admin/families/{id}`
- `GET /api/admin/reports/summary`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

La API base usa `VITE_API_BASE` con fallback local:

```text
http://127.0.0.1:5052/api
```

Scripts:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## Autenticacion JWT

Backend:

- `POST /api/auth/login` genera JWT.
- Claims principales: user id, name, username, role, `IsAdmin`, `ProgramId`.
- Middleware valida `Authorization: Bearer <token>`.
- Expiracion default: 480 minutos.

Frontend:

- Token en `localStorage` bajo `folio.auth.token`.
- Usuario en `localStorage` bajo `folio.auth.user`.
- Requests usan `Authorization: Bearer <token>`.
- Si un endpoint responde 401, se limpia sesion y se redirige a `/login`.

Importante: cambiar `Jwt.Key` en produccion por una clave segura de al menos 32 caracteres.

## Roles y Permisos

`IsAdmin = true`

- Ve todos los programas.
- Accede al panel admin.
- Administra usuarios, catalogos y reportes.
- Puede crear documentos en cualquier programa.
- Puede editar, cerrar, cancelar y reabrir documentos segun flujo del sistema.

`LEADER`

- Ve documentos de su programa.
- Puede editar documentos abiertos de su programa.
- Puede cancelar documentos abiertos de su programa.
- Puede reabrir documentos cancelados de su programa.
- Si reasigna responsable, debe capturar razon.

`ENGINEER`

- Ve documentos de su programa.
- Puede editar, cerrar y cancelar documentos abiertos donde es responsable.

`DRAFTER`

- Ve documentos de su programa.
- No tiene acciones administrativas.

## Flujo Principal

1. El usuario inicia sesion.
2. El dashboard muestra resumen de documentos por estado.
3. El usuario navega por `BCN`, `DCN` o `DFM`.
4. Crea un documento con programa, familia, responsable, model year, fase y campos especificos:
   - `BCN`: car leader automatico por programa y descripcion de cambio.
   - `DCN`: car leader automatico por programa, documento asociado y descripcion de cambio.
   - `DFM`: composite, issue y DRE.
5. El backend genera el folio via `GenerateEngineeringFolio`.
6. El detalle permite editar documentos abiertos, cerrar, cancelar o reabrir cancelados segun rol.

Por definicion del sistema, no hay eliminacion fisica de documentos. `CLOSED` es definitivo; solo `CANCELLED` puede volver a `OPEN`.

## Validacion Actual

Comandos usados durante desarrollo:

```powershell
cd frontend
npm run lint
npm run build
```

```powershell
cd backend
$env:DOTNET_CLI_HOME='c:\projects\folio-system\backend'
dotnet build -o temp-build-verify
```

No hay pruebas automatizadas detectadas.

## Despliegue en Render

El repositorio incluye:

- `render.yaml`
- `backend/Dockerfile`
- Backend con CORS configurable por entorno
- Frontend con `VITE_API_BASE` configurable

Render no ofrece SQL Server administrado. Para produccion se requiere SQL Server externo, por ejemplo Azure SQL Database.

Variables backend:

- `ConnectionStrings__EngineeringRegistryDb`
- `Jwt__Key`
- `Cors__AllowedOrigins__0`

Variable frontend:

- `VITE_API_BASE`

## Deuda y Pendientes

Prioridad alta:

- Quitar fallback de password plano y usar hashing obligatorio.
- Guardar historial/auditoria de acciones con usuario, accion, razon y fecha.
- Probar flujo end-to-end con datos reales.

Prioridad media:

- Crear usuarios nuevos desde Admin Users.
- Reset de password desde Admin Users.
- Reportes mas utiles: filtros, exportacion y actividad historica.
- Agregar pruebas de backend y frontend.

Prioridad baja:

- Revisar responsive final con datos reales.
- Considerar tema oscuro.

## Notas de Limpieza

Los artefactos generados no deben versionarse:

- `backend/bin/`
- `backend/obj/`
- `backend/temp-build*/`
- `frontend/dist/`
- `frontend/node_modules/`

El `.gitignore` ya cubre `bin/`, `obj/`, `dist/`, `node_modules/` y logs.
