# Clínica Veterinaria Uniminuto — Frontend

Aplicación web para gestionar una clínica veterinaria: citas, mascotas, médicos, especializaciones, fórmulas e historias médicas. Consume el API REST del backend (Spring Boot).

## Tecnologías

Angular 19 (componentes standalone), TypeScript 5.6, RxJS 7.8, Bootstrap 5.3, ng-bootstrap 18, SweetAlert2, Karma/Jasmine y ESLint. La interfaz parte de la plantilla Datta Able (MIT).

## Requisitos

- Node.js 20 o superior y npm
- Google Chrome (para las pruebas)
- El backend en `http://localhost:8080/clinica/v1`, con el origen `http://localhost:4200` permitido en `CORS_ORIGINS`

## Ejecución local

```
npm ci
npm start
```

La aplicación queda en `http://localhost:4200`. El inicio de sesión pide usuario, contraseña y un código OTP enviado por correo.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/` |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Pruebas |
| `npm run lint` | Análisis estático |

La URL del API se define en `src/environments/`: absoluta en desarrollo y relativa (`/clinica/v1`) en producción.

## Estructura

| Carpeta en `src/app` | Contenido |
|---|---|
| `demo/pages` | Un módulo por carpeta, con su servicio |
| `guards`, `interceptors` | Control de acceso, token y errores HTTP |
| `models` | Datos que se envían y reciben del API |
| `services` | `BackendService`, acceso HTTP común |
| `shared`, `utils` | Utilidades de tablas y JWT |
| `theme` | Menú, barra superior y componentes visuales |

Los cambios se registran en [docs/CAMBIOS-FRONTEND.md](docs/CAMBIOS-FRONTEND.md).
