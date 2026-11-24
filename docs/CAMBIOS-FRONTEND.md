# Cambios del frontend

## Fase 1: correcciones y base

### Corregido

- Editar médico usa `POST /medico/actualizar`.
- Se ocultó "recuperar contraseña" (`TODO` en el código): el endpoint no existe.
- `environment.ts` y `environment.prod.ts` tienen las mismas claves; producción usa `/clinica/v1`. El build de producción compila.
- Botón "Cerrar sesión" con usuario y rol. Llama a `POST /auth/cerrar-sesion` y limpia la sesión aunque falle o tarde más de 5 segundos.
- `authGuard` rechaza tokens ausentes, ilegibles o vencidos.
- Interceptores funcionales: `authInterceptor` (Bearer solo hacia el API) y `errorInterceptor` (401, 403, 0 y 5xx). `BackendService` ya no arma encabezados.
- La historia sin mascota muestra un aviso.
- "Inicio" y los logos apuntan a `/inicio`.
- La búsqueda de fórmulas incluye las indicaciones.
- Sin `console.log` de datos; `listEspecializaciones` de Citas pasó a `listCitas`; nombre de la clínica en la barra.
- Utilidades de tabla en `shared/utils/tabla.util.ts` para las pantallas nuevas.

### Eliminado

- Carpeta `medicos/`, `demo/ui-elements`, `demo/widget`, amCharts, icofont, `GuestComponent`, `nav-search`, directiva de pantalla completa sin uso, avatares de muestra y `yarn.lock`.
- Dependencias sin uso: `apexcharts`, `ngx-bootstrap`, `@fortawesome/angular-fontawesome`, `@types/lodash`.
- Métodos sin uso contra endpoints inexistentes: `actualizarHistoria`, `listar` y `actualizar` de anotaciones, `usuario/test`. `usuario/listar` pasó a `usuario/listar-ordenado`.

### Pruebas

- Las 121 pruebas anteriores no se ejecutaban: `src/test.ts` usaba `require.context`, que Angular 19 no admite. Corregido.
- Se eliminaron 5 con el código que probaban (2 de `medicos/`, 1 de historia y 2 de anotaciones) y se ajustaron las de médico al contrato (POST; los GET no llevan `Content-Type`).

## Decisiones

- Los errores de `/auth/login` y `/auth/validate-token` los muestra la pantalla de login, no el interceptor.
- Un 401 solo cierra la sesión si corresponde al token vigente, para no repetir avisos ni cerrar una sesión nueva.

## Pendiente de coordinar con el backend

| Tema | Contrato | Backend en el commit 188d956 |
|---|---|---|
| `/medico/listar-disponibles` | `inicio`, `fin` | `fechaInicio`, `fechaFin` (lo que el frontend usa hoy) |
| Claim `rol` | código del perfil | nombre del perfil en mayúsculas |
| Claim `menus` | `{ code, name, activo }` | entidad `Menu` completa (con `title`, no `name`) |
| Claim `medicoId` | número o `null` | no existe |
| Duración de la cita | según el servicio | 30 minutos fijos (el frontend muestra 15 hasta la fase 5) |

El build queda en `dist/` (no en `dist/<proyecto>/browser`), porque el proyecto usa el builder `browser`.
