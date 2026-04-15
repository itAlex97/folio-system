# Folio System

Sistema interno para registrar, consultar y administrar folios de cambios de ingenieria. El proyecto esta dividido en un backend ASP.NET Core con SQL Server y un frontend React/Vite.

## Estado Actual

El sistema esta en estado MVP funcional para demo o uso interno controlado:

- Login con usuarios activos.
- Roles: `ADMIN`, `LEADER`, `ENGINEER`, `DRAFTER`.
- Listado, busqueda, filtros y ordenamiento de documentos.
- Creacion de documentos `BCN`, `DCN` y `DFM`.
- Detalle de documento con acciones por rol.
- Edicion de documentos abiertos.
- Cierre, cancelacion, reapertura, cambio de estado y eliminacion con restricciones.
- Pantallas admin basicas para usuarios, catalogos y reportes.
- UI redisenada con paleta neutral, acento rojo corporativo e iconografia `lucide-react`.

No esta listo como produccion abierta todavia. Las principales deudas son autenticacion real, auditoria persistente, mejores formularios admin, pruebas automatizadas y limpieza del flujo de prompts.

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
  scripts/            SQL de esquema/seed/migraciones manuales
  folio-system.sln
  README.md
```

## Configuracion Local

### Base de datos

La cadena de conexion esta en:

- `backend/appsettings.json`
- `backend/appsettings.Development.json`

Valor actual:

```text
Data Source=.\SQLEXPRESS;Initial Catalog=EngineeringRegistryDB;Integrated Security=True;TrustServerCertificate=True
```

Scripts disponibles:

- `scripts/update-users-auth-schema.sql`: recrea `Users` con username/password.
- `scripts/recreate-engineering-changes-with-audit.sql`: recrea tablas de documentos y detalles. Borra datos de esas tablas.
- `scripts/add-created-by-user-audit.sql`: agrega `CreatedByUserId` a documentos existentes.
- `scripts/seed-initial-data.sql`: carga programas, tipos, familias, usuarios y secuencias iniciales.

El backend espera que exista el stored procedure `GenerateEngineeringFolio`, usado al crear documentos.

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
- `PATCH /api/engineering-changes/{id}/status`
- `DELETE /api/engineering-changes/{id}`
- `GET /api/document-form-options`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}`
- `GET /api/admin/catalogs`
- `POST /api/admin/programs`
- `POST /api/admin/document-types`
- `POST /api/admin/families`
- `GET /api/admin/reports/summary`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

La API base esta fija en `frontend/src/api/client.ts`:

```ts
export const API_BASE = 'http://127.0.0.1:5052/api';
```

Scripts:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## Roles y Permisos

`ADMIN`

- Ve todos los programas.
- Puede administrar usuarios, catalogos y reportes.
- Puede editar documentos abiertos.
- Puede cerrar, cancelar, reabrir, cambiar estado y eliminar documentos no cerrados.

`LEADER`

- Ve documentos de su programa.
- Puede editar documentos abiertos de su programa.
- Puede cancelar documentos abiertos de su programa.
- Si reasigna responsable, debe capturar razon.

`ENGINEER`

- Ve documentos de su programa.
- Puede editar/cerrar/cancelar documentos abiertos donde es responsable.

`DRAFTER`

- Ve documentos de su programa.
- No tiene acciones administrativas.

## Flujo Principal

1. El usuario inicia sesion.
2. El dashboard muestra resumen de documentos por estado del programa.
3. El usuario navega por `BCN`, `DCN` o `DFM`.
4. Crea un documento con programa, familia, responsable, model year, fase y campos especificos:
   - `BCN`: car leader, descripcion de cambio.
   - `DCN`: car leader, documento asociado, descripcion de cambio.
   - `DFM`: composite, issue, target.
5. El backend genera el folio via `GenerateEngineeringFolio`.
6. El detalle permite editar o cambiar estado segun rol y estado actual.

## Sistema Visual

La UI usa IBM Plex Sans, grises neutrales y rojo corporativo como acento.

Tokens principales:

```css
--bg-base: #f6f7f9;
--surface: #ffffff;
--line-soft: #e5e7eb;
--text-main: #1f2933;
--text-muted: #6b7280;
--primary: #e32822;
--primary-hover: #c81f1a;
--primary-soft: #fce8e7;
```

Reglas de mantenimiento:

- Usar variables CSS antes que colores hardcoded.
- Mantener botones y cards con radios pequenos (`6px` a `10px`).
- Usar `lucide-react` para iconografia.
- Evitar prompts del navegador en nuevos flujos; preferir dialogos o formularios.
- Mantener estados `hover`, `focus-visible`, `disabled` visibles.

## Validacion Actual

Ultima verificacion local:

```powershell
cd frontend
npm run build
```

Resultado: pasa.

```powershell
cd frontend
npm run lint
```

Resultado: pasa.

```powershell
$env:DOTNET_CLI_HOME='c:\projects\folio-system\backend'
dotnet build c:\projects\folio-system\backend\backend.csproj
```

Resultado: pasa. Puede mostrar warnings `NU1900` si el entorno no puede consultar NuGet para datos de vulnerabilidades.

No hay pruebas automatizadas detectadas.

## Deuda y Pendientes

Prioridad alta:

- Reemplazar autenticacion por header `X-Auth-User-Id` con JWT/sesion real.
- Quitar fallback de password plano y usar hashing obligatorio.
- Guardar historial/auditoria de acciones con usuario, accion, razon y fecha.

Prioridad media:

- Reemplazar `window.prompt` y `window.confirm` por modales/formularios.
- Mejorar Admin Users: crear usuario, reset password, editar en formulario.
- Mejorar Admin Catalogs: editar/desactivar/catalogar familias y tipos.
- Hacer reportes mas utiles: filtros, exportacion y actividad historica.
- Agregar pruebas de backend y frontend.

Prioridad baja:

- Revisar responsive final con datos reales.
- Considerar tema oscuro.
- Mover configuracion de API base a variables de entorno.

## Notas de Limpieza

Los artefactos generados no deben versionarse:

- `backend/bin/`
- `backend/obj/`
- `backend/temp-build*/`
- `frontend/dist/`
- `frontend/node_modules/`

El `.gitignore` ya cubre `bin/`, `obj/`, `dist/`, `node_modules/` y logs. Las carpetas temporales del backend tambien deben mantenerse fuera del repo.
