# Frontend Clínica Veterinaria — Angular

Interfaz web en **Angular** que consume el backend de Spring Boot del examen. Implementa el
**menú principal** y el **enrutamiento** de cada módulo de gestión: cada tabla de la base de
datos (Paciente, Cita, FormulaMedica, HistoriaMedica, AnotacionHistoria) es un módulo de
Angular independiente, con sus propias rutas internas.

## 1. Requisitos

- **Node.js 18+** (incluye npm).
- El **backend de Spring Boot corriendo** en `http://localhost:8080` (ver el otro proyecto).

## 2. Cómo ejecutarlo

```bash
cd clinica-frontend
npm install
npm start
```

Esto levanta el servidor de desarrollo de Angular en `http://localhost:4200`. Abre esa URL en
el navegador; el menú superior te deja moverte entre los 5 módulos.

> Si el backend no está corriendo, cada pantalla muestra un mensaje de error claro en vez de
> quedarse "cargando" para siempre.

## 3. Arquitectura y enrutamiento

```
src/app/
 ├─ app.module.ts              -> modulo raiz (Browser, Forms, HttpClient)
 ├─ app-routing.module.ts      -> rutas principales (una por cada modulo, con lazy loading)
 ├─ app.component.*            -> menu de navegacion + <router-outlet>
 ├─ pacientes/                 -> modulo de gestion de Paciente
 │   ├─ pacientes.module.ts
 │   ├─ pacientes-routing.module.ts
 │   ├─ paciente.model.ts / paciente.service.ts
 │   ├─ paciente-list/         (listar)
 │   └─ paciente-form/         (crear)
 ├─ citas/                     -> modulo de gestion de Cita
 │   ├─ cita-list/             (filtrar por rango de fechas)
 │   └─ cita-form/             (crear / editar)
 ├─ formulas/                  -> modulo de gestion de FormulaMedica
 │   └─ formula-list/          (listar, de mas reciente a mas antigua)
 ├─ historias/                 -> modulo de gestion de HistoriaMedica
 │   ├─ historia-list/         (listar / filtrar por fecha / eliminar)
 │   └─ historia-form/         (crear / editar)
 └─ anotaciones/                -> modulo de gestion de AnotacionHistoria
     ├─ anotacion-list/        (listar por id de historia medica)
     └─ anotacion-form/        (crear / editar)
```

Cada modulo se carga de forma perezosa (**lazy loading**) desde `app-routing.module.ts`, usando
`loadChildren`. Esto significa que el codigo de, por ejemplo, el modulo de Citas, solo se
descarga en el navegador cuando el usuario entra a esa seccion, no al abrir la aplicacion.

### Mapa de rutas

| Ruta | Componente | Descripcion |
|---|---|---|
| `/pacientes` | PacienteListComponent | Lista de pacientes |
| `/pacientes/nuevo` | PacienteFormComponent | Crear paciente |
| `/citas` | CitaListComponent | Citas filtradas por rango de fecha |
| `/citas/nueva` | CitaFormComponent | Crear cita |
| `/citas/editar/:id` | CitaFormComponent | Editar cita |
| `/formulas` | FormulaListComponent | Formulas medicas del inventario |
| `/historias` | HistoriaListComponent | Historias medicas (con filtro de fecha) |
| `/historias/nueva` | HistoriaFormComponent | Crear historia medica |
| `/historias/editar/:id` | HistoriaFormComponent | Editar historia medica |
| `/anotaciones?historiaId=X` | AnotacionListComponent | Anotaciones de una historia medica |
| `/anotaciones/nueva` | AnotacionFormComponent | Crear anotacion |
| `/anotaciones/editar/:id` | AnotacionFormComponent | Editar anotacion |

## 4. Decisiones de diseño (para la sustentación)

- **Un modulo por tabla**: cada entidad del backend tiene su propio `NgModule`, su propio
  archivo de rutas internas (`*-routing.module.ts`) y sus propios componentes, tal como se
  pidio ("cada tabla de la BD es un modulo de gestion nuevo").
- **Enrutamiento anidado**: las rutas de cada modulo (`/nueva`, `/editar/:id`, etc) estan
  definidas dentro del modulo mismo y se combinan con el prefijo definido en
  `app-routing.module.ts` (por ejemplo `/citas` + `/nueva` = `/citas/nueva`).
- **Servicios por entidad**: cada modulo tiene un `*.service.ts` que centraliza las llamadas
  HTTP a su endpoint correspondiente del backend (`environment.apiUrl` define la URL base).
- **Edicion sin endpoint "obtener por id"**: el backend no expone `GET /api/citas/{id}` ni
  `GET /api/anotaciones/{id}` (solo Historia Medica lo tiene). Para esos casos, el componente
  de lista guarda temporalmente el registro elegido en el propio servicio antes de navegar al
  formulario de edicion, en vez de pedirlo de nuevo al servidor.
- Se verifico con `ng build` (modo desarrollo y produccion, con chequeo de tipos de las
  plantillas) que **todo el proyecto compila sin errores**.

## 5. Próximos pasos sugeridos

- Agregar un selector (dropdown) de pacientes en los formularios de Cita e Historia Medica,
  en vez de pedir el id manualmente.
- Agregar paginacion si la lista de registros crece mucho.
