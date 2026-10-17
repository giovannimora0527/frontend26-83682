# Segundo parcial — Frontend Angular

Aplicación Angular 17 para la gestión de citas, historias clínicas, anotaciones y fórmulas médicas.

## Ejecución

Requiere Node.js compatible con Angular 17 y npm. No reutilice `node_modules` de otro sistema operativo: instale las dependencias en el equipo donde se ejecutará.

```bash
npm ci
npm start
```

La API se configura en `src/environments/environment.ts` (por defecto `http://localhost:8080/api`).

## Implementación relevante

- Servicios `HttpClient` separados de los componentes.
- Formularios con validación y mensajes de error del backend.
- Citas: listado con búsqueda, filtro por fechas, ordenamiento y paginación; el formulario de edición consulta `GET /api/citas/{id}` y no depende de datos en memoria.
- Historias: búsqueda por texto, ordenamiento, paginación y detalle con acceso al historial de anotaciones.
- Anotaciones: veterinario, fecha, descripción, observación y diagnóstico/evolución; listado con filtro, ordenamiento, paginación y detalle.
- Fórmulas: filtros por varios campos, ordenamiento por columnas, paginación y modales de edición/detalle.
- Los combos dependientes consultan las mascotas desde `GET /api/clientes/{id}/mascotas`.

Validar el build con `npm run build` en un entorno con dependencias instaladas localmente.
