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

## Fase 2: infraestructura

- JWT: `medicoId` opcional y menús con `code` y `activo` obligatorios.
- `AuthService`: `guardarSesion`, `obtenerToken`, `obtenerUsuario`, `tieneRol`, `tieneMenu`, `estaVencido`, `cerrarSesion`. `SesionService` avisa 2 minutos antes del vencimiento, cierra la sesión y retira los modales abiertos.
- `menuGuard` en las 16 rutas de C4 y directiva `*appTieneRol`. Los módulos que aún no existen muestran "en construcción".
- Menú en cuatro secciones; la bienvenida ofrece accesos solo a los módulos autorizados (los datos por rol van en la fase 9).
- `BackendService`: `patch`, `delete`, `getBlob` (convierte a JSON los errores de descarga) y `postArchivo`. Utilidades en `shared/utils/http.util.ts`.
- Modelos del contrato en `models/`, sin campos duplicados en snake_case. La ruta `medicamentos` y su pantalla se eliminaron.
- Componentes: `app-badge-estado`, `app-filtro-fechas`, `app-paginacion`, `app-boton-orden` (con la clase `Tabla`), `app-boton-descarga`. Pipes `moneda` y `fechaHora`.

### Modelos por confirmar con el backend

El contrato no define el JSON de respuesta de: atención (`/atencion/cita/{citaId}`), fórmula y sus listados, movimientos de inventario, historial de tarifas y de estados, configuración de la clínica, encabezado del despacho y sus historiales, factura, pagos y catálogo de reportes. Los modelos de esas respuestas son una propuesta y se ajustan en la fase de cada módulo.

### Resuelto por el backend (commit 4363b46)

Los claims `rol` (código), `medicoId` y `menus` (con `name`) ya cumplen C3.

## Corrección del contrato (datos reales del profesor)

- El menú de citas tiene código `cita`; la ruta sigue siendo `/inicio/citas`.
- `medicamentos` lo reemplaza `inventario`.
- Los menús del JWT traen `code`, `title`, `url`, `icon` y `activo`. El filtro usa solo `code`. Los títulos e iconos salen de `navigation.ts`, porque los de la base son clases de Feather incompletas (`icon-calendar`, sin `feather`).
- La interfaz muestra el nombre del perfil (Administrador, Recepcion, Medico, Despacho Medico) y la lógica usa el código (`codigoRol` y `nombreRol` en `shared/estados-ui.ts`).

## Fase 3: módulos base

- **Clientes**: listado, creación y edición; consulta de mascotas y facturas. El documento duplicado (409) se muestra junto al campo.
- **Usuarios**: listado, creación, edición y activación. Nadie puede inactivar su propia cuenta desde la pantalla. La contraseña admite hasta 72 bytes (límite de BCrypt en el backend).
- **Médicos**: horarios por día (`PUT /medico/{id}/horarios`) y usuario del sistema. El select de usuarios solo lo ve ADMINISTRADOR, porque `/usuario/listar-ordenado` es solo suyo; SECRETARIA conserva el vínculo existente.
- **Especializaciones**: activar e inactivar con confirmación y filtro "solo activas". Las inactivas no se ofrecen a médicos nuevos.
- El build de producción ya no descarga la fuente de Google al compilar (fallaba sin Internet); la carga el navegador.

### Diferencias con el enunciado, según los DTO del backend

| Tema | Enunciado | Backend | Frontend |
|---|---|---|---|
| Cliente | sin fecha de nacimiento | `fechaNacimiento` obligatoria, `genero` opcional | incluye ambos; correo y dirección opcionales |
| Usuario | campo "nombre" | `UsuarioRq` no lo tiene | no se muestra, porque no se guardaría |
| Perfil | `/perfil/listar` | la entidad usa `perfilId` | acepta `id` o `perfilId` |
| Vínculo médico-usuario | opcional | no se puede quitar (sin `usuarioId` conserva el actual) | se puede cambiar, no quitar |

### Pendiente en el backend (revisado sobre 4363b46 y su árbol de trabajo)

- No existen todavía: `PATCH /usuario/{id}/estado`, `GET /perfil/listar`, `GET/PUT /medico/{id}/horarios`, `PATCH /especializacion/{id}/estado` y `GET /factura/cliente/{id}`. Sin `/perfil/listar` no se pueden crear ni editar usuarios.
- `db/03_datos_iniciales.sql` usa el código de menú `citas`; debe ser `cita`.
- Los duplicados (409) no traen `detalles`: el campo se deduce del mensaje. Conviene agregar `detalles`.
- La entidad `Cita` pasa a `fechaInicio`, `fechaFin` y estados en mayúsculas, y `/formula-medica/guardar` y `/actualizar` cambian. Citas, Historias y Fórmulas se adaptan en las fases 5 y 6; hasta entonces no funcionan del todo con ese backend.
