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

### Resuelto por el backend (28d89e5)

Perfiles, estado de usuarios y especializaciones, horarios, facturas por cliente, código de menú `cita` y 409 con `detalles`. `POST /cliente/guardar` responde `{status, message, data}`; `POST /cliente/{id}` sigue respondiendo el cliente sin envoltura.

## Fase 4: inventario y carga masiva

- Modelos ajustados a `docs/api.md` del backend (producto, movimiento, carga, perfil, usuario, fórmula y factura). No había datos simulados en la aplicación.
- Los duplicados se muestran junto al campo en clientes, usuarios, médicos, especializaciones, productos, lotes y ajustes (`marcarErroresServidor`).
- **Inventario** (`/inicio/inventario` y `/inicio/inventario/:id`): alertas que filtran, detalle con lotes y kardex, crear, editar, activar, entradas y ajustes. Solo ADMINISTRADOR ve las acciones de escritura.
- **Carga masiva** (`/inicio/carga-inventario`): asistente de 4 pasos, historial, informe de errores y retomar una carga sin confirmar. El kardex enlaza con la carga de origen.
- Corregido: la ruta comodín de `/inicio` se redirigía a sí misma y fallaba en modo desarrollo.

### Decisiones

- "Solo disponibles" exige existencias vigentes, porque `cantidadDisponible` incluye los lotes vencidos.
- El listado se filtra en el navegador; las alertas cuentan solo productos activos, así que al pulsarlas se activa "Solo activos".
- `/impuesto/listar` aún no existe (fase de tarifas del backend): mientras tanto se ofrecen los impuestos que ya tienen los productos. El cambio será automático.

### Verificado contra el backend real (24/11/2026)

Con OTP de Mailpit y Chrome: los cuatro roles entran y ven solo sus menús. Fase 3 completa con duplicados. Producto con lote inicial, entrada, ajuste y kardex. `carga_inventario_60` en xlsx y csv: 60 filas, 55 válidas y 5 con error (filas 11, 21, 32, 41 y 51). Encabezados incorrectos: 400 con faltantes y sobrantes. DESPACHO_MEDICO: solo lectura.

### Pendiente para otras fases

- El enlace del kardex al despacho se agrega en la fase 7.
- Citas, Historias y Fórmulas todavía usan el modelo anterior (fases 5 y 6). `/medico/listar-disponibles` sigue con `fechaInicio` y `fechaFin` en el backend.

## Fase 5: calendario y citas

- Dependencias: FullCalendar 6.1.22 (compatible con Angular 19; la versión 7 no usa los mismos paquetes). Calendario, inventario y carga masiva se descargan solo al visitarlos.
- **Calendario** (`/inicio/calendario`, solo MEDICO): mes, semana, día y agenda; eventos y contadores desde la API por rango visible; horario de atención sombreado; crear, reprogramar (arrastrando o desde el detalle), confirmar y cancelar con motivo; historiales; reporte Excel. Ante un 409 se muestra el mensaje del backend y el evento vuelve a su lugar.
- "Iniciar", "Continuar" y "Ver atención" llevan a `/inicio/atencion/:citaId` (en construcción hasta la fase 6). Nunca se envía EN_ATENCION ni ATENDIDA por PATCH.
- **Citas**: servicio con su duración, estados del contrato, transición a Confirmada o Cancelada, cancelación por PATCH con motivo e historial de la mascota. `listar-disponibles` usa `inicio` y `fin`.
- Modelos de cita, calendario y atención según `docs/api.md`. Historias y Fórmulas leen `fechaInicio`.

### Decisiones

- Redimensionar solo el final de una cita se revierte con un aviso, porque la duración la define el servicio.
- Los contadores cubren el rango visible; en la vista de mes incluye los días contiguos que se muestran.
- Al editar una cita se ofrece siempre el médico asignado, aunque la propia cita lo marque ocupado; el backend valida el cruce. Las citas antiguas sin servicio conservan 30 minutos.
- No se hizo el calendario de solo lectura para ADMINISTRADOR y SECRETARIA (opcional en el enunciado).

### Verificado contra el backend real (24/11/2026)

Crear en una franja, choque (409 junto al campo), arrastrar, cancelar el arrastre, 409 al arrastrar sobre una cita ocupada (revierte), reprogramar fuera de horario, confirmar, cancelar, historiales, vistas, Excel, y Citas con Recepcion. 360, 768 y 1366 px. Sin probar contra el backend real: los documentos de una cita atendida (prefactura y fórmulas).

### Pruebas

Las pruebas de Citas se ajustaron al contrato (duración por servicio, estados y cancelación).

## Fase 6: tarifas, atención, fórmulas e historias

- **Tarifas** (`/inicio/tarifas`): servicios, tarifas con motivo y comparación antes/después, impuestos, historial y datos de la clínica. Tras cambiar una tarifa se recarga la lista (el backend devuelve un id nuevo).
- **Impuestos**: el porcentaje se bloquea si el impuesto está en uso. El API no informa el uso: se deduce de las tarifas (también cerradas) y de los productos; el backend decide. El inventario usa `/impuesto/listar`.
- **Atención** (`/inicio/atencion` y `/inicio/atencion/:citaId`): antecedentes, consulta con borrador y autoguardado cada 60 s, servicios, fórmulas, finalizar y prefactura. Un 409 al iniciar vuelve al calendario. Pregunta antes de salir con cambios.
- **Fórmulas**: se crean en la atención, con cantidad sugerida y disponibilidad. El módulo quedó de consulta, con búsqueda en indicaciones. El modelo anterior (`models/formula.ts`) se eliminó.
- **Historias**: al finalizar, el backend guarda la atención como anotación de texto ("Motivo: …", "Síntomas: …", "Recomendaciones: …"); se separa por campos. Si ese formato cambia, se muestra como anotación normal.
- `BackendService` admite un recurso sin sub-ruta (`/configuracion-clinica`).

### Decisiones

- Al abrir una atención sin servicios se propone el agendado.
- Las citas atendidas hoy aparecen aparte, para poder agregar una fórmula olvidada ese mismo día.
- Un "Guardar borrador" pulsado durante otro guardado queda en cola.

### Verificado contra el backend real (24/11/2026)

Con `medico1`: 409 por otro día, iniciar, borrador, salida con cambios, servicios, fórmula de dos medicamentos (guardar, editar, confirmar), impedimentos para finalizar, finalizar, PDF de fórmula y prefactura, fórmula olvidada y anulación, documentos en el calendario, Fórmulas e Historias. Con `admin`: las cinco pestañas de Tarifas. 360, 768 y 1366 px. Sin probar contra el backend real: el 409 por servicio sin tarifa al finalizar.

### Observación

En una prueba, un cambio de Observaciones no quedó guardado después de rechazar la salida y pulsar "Guardar borrador". No se pudo reproducir en 14 intentos. La causa más probable es que coincidió con otro guardado; de ahí la cola.

## Fase 7: despacho

- **Despacho** (`/inicio/despacho`): bandeja con búsqueda, filtros y refresco cada minuto; log de despachos; historial por medicamento. `/inicio/despacho/:formulaId`: preparación, lotes FEFO, validaciones, confirmar, liberar, cancelar e historial de estados.
- **Idempotencia**: la clave se conserva mientras no haya una respuesta definitiva (sin respuesta o 5xx) y se renueva después.
- Los errores `items[n]` marcan en rojo la fila del lote; se recargan los lotes y se conserva lo escrito.
- **ADMINISTRADOR**: abre el despacho desde el kardex o desde Inventario → "Log de despachos" (`/inicio/inventario/despachos`), y ahí puede revertir o cancelar lo pendiente.
- El API no expone un despacho por id: el kardex lo busca por su número en el historial.

### Decisiones

- No se ofrece revertir despachos facturados, revertidos o sin entregas. Con entregas, DESPACHO_MEDICO no ve "Cancelar".
- El estado previsto sigue la tabla de `reglas-negocio.md` y es solo informativo.

### Errores propios encontrados y corregidos

- Tras recargar los lotes, los campos seguían atados a los controles anteriores: la lista debe seguir al grupo del formulario. Tiene prueba.
- `[max]` en el campo numérico revalidaba el control y borraba la marca roja.

### Verificado contra el backend real (24/11/2026)

FM-000010: preparar, liberar, 409 por lote, entrega parcial (DP-000004), entrega del resto con la respuesta cortada y reintento con la misma clave sin doble descuento (DP-000005), comprobante, historiales, log, kardex y reversión por admin. 360, 768 y 1366 px. Solo con pruebas automáticas: cancelar, otro usuario preparando, lotes vencidos y confirmar sin ítems.

## Fase 8: facturación

- **Facturación** (`/inicio/facturacion`): Por facturar (previsualización, descuentos por renglón con motivo y tope, totales en vivo), Facturas (filtros, detalle, PDF, pagos, historial de estados) e Historial por propietario o mascota.
- Los totales en pantalla repiten el cálculo del backend (HALF_UP a 2 decimales por renglón); el valor definitivo es el que devuelve al generar.
- Anular: solo ADMINISTRADOR, con motivo y doble confirmación; se muestra el aviso de pagos conservados.

### Verificado contra el backend real (24/11/2026)

Con `secretaria`: tope de 10 %, factura FV-000001 con 5 %, PDF, pago mayor al saldo rechazado, pago parcial y resto por transferencia. Con `admin`: anulación; la cita volvió a Por facturar. 360, 768 y 1366 px. Solo con pruebas automáticas: 409 por servicio sin tarifa y descuento del 100 %.
