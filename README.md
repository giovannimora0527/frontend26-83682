# Clínica Veterinaria UNIMINUTO

Frontend Angular 19 del examen de Programación Web Full Stack. Repositorio `frontend26-83682`. Consume el backend `backend2026-83682` y presenta los módulos según el perfil autenticado.

## Docker Compose

Inicia primero el Compose del backend. Desde la raíz de este repositorio ejecuta:

```powershell
$env:BACKEND_NETWORK = 'clinica-demo_default'
docker compose -p clinica-demo-web up -d --build --wait
docker compose -p clinica-demo-web ps
```

Usa el nombre de red del backend que hayas creado. Con el nombre predeterminado del backend se usa `backend2026-83682_default`. Nginx sirve Angular en el puerto 18080 y reenvía `/clinica/v1/` a `backend:8080`. Puedes configurar `FRONTEND_PORT`, `BACKEND_NETWORK` y `BACKEND_UPSTREAM`.

- [Inicio de sesión](http://localhost:18080/#/login)
- [Swagger por Nginx](http://localhost:18080/clinica/v1/swagger-ui/index.html)

Angular usa rutas con fragmento. Los enlaces directos de las pantallas usan `/#/inicio/...`.

## Desarrollo

Requiere Node 22 y npm. Instala desde el lockfile con `npm ci`. Ejecuta `npm start` y abre [Angular local](http://localhost:4200/#/login). El entorno de desarrollo se conecta a la API local configurada en `src/environments/environment.ts`.

```powershell
npm run build -- --configuration production
npm run test -- --watch=false --browsers=ChromeHeadless
```

Para las pruebas del navegador usa cuentas de demostración administradas en el backend. Las contraseñas se comparten por un canal privado. El interceptor adjunta JWT a las solicitudes de API y el menú se construye con los permisos recibidos del servidor.

## Uso

Administración y Recepción gestionan clientes y citas. El médico consulta su calendario, el historial de citas de una mascota y sus atenciones y fórmulas. Despacho identifica lotes próximos a vencer y conserva la prioridad FEFO aplicada por el backend. Los reportes de existencias muestran el saldo actual sin fechas y el saldo histórico por lote con un rango. Los tipos habilitados se pueden descargar en PDF o Excel.

El diseño se basa en Datta Able Angular Lite, de CodedThemes. Consulta la licencia incluida en [LICENSE](LICENSE).
