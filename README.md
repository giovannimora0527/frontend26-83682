[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Price](https://img.shields.io/badge/price-FREE-0098f7.svg)](https://codedthemes.com/item/datta-able-angular-lite/)
[![GitHub package version](https://img.shields.io/github/package-json/v/codedthemes/datta-able-free-angular-admin-template)](https://github.com/codedthemes/datta-able-free-angular-admin-template/)

| -------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **9** Demo pages                                                                                   | **45+** demo pages                                                |
| -                                                                                                  | ✓ Multi-language                                                  |
| -                                                                                                  | ✓ Dark/Light Mode 🌓                                              |
| -                                                                                                  | ✓ TypeScript version                                              |
| -                                                                                                  | ✓ 6+ color Options                                                |
| -                                                                                                  | ✓ RTL                                                             |
| ✓ MIT License                                                                                      | ✓ [Pro License](https://codedthemes.com/item/datta-able-angular/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium) |

#### Preview

- [Demo](https://codedthemes.com/demos/admin-templates/datta-able/angular/free/dashboard)

#### Download

- [Download from GitHub](https://github.com/codedthemes/datta-able-free-angular-admin-template)

## Datta Able Pro version

#### Preview

- [Demo](https://codedthemes.com/demos/admin-templates/datta-able/angular/default/)

#### Purchase

- [Purchase from CodedThemes](https://codedthemes.com/item/datta-able-angular/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)

## Table of contents

- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Author](#author)
- [Issues?](#issues)
- [License](#license)
- [More Free Angular Templates](#more-free-angular-dashboard-templates)
- [More Pro Angular Templates](#more-premium-angular-dashboard-templates)
- [Follow us](#follow-us)

## Despliegue local con Docker

Con Spring Boot y MySQL en ejecución desde el Compose de `backend2026-83682`, ejecuta `docker compose up -d --build --wait` en este repositorio y abre [la página de inicio de sesión](http://localhost:18080/login).

Por defecto, Nginx reenvía las solicitudes de `/clinica/v1/` a `backend:8080` por la red Docker existente `backend2026-83682_default`. Puedes ajustar `FRONTEND_PORT`, `BACKEND_UPSTREAM` y `BACKEND_NETWORK` como variables de entorno al ejecutar Compose.

Comprueba el contenedor con `docker compose ps`. Para retirar este despliegue, ejecuta `docker compose down` desde este repositorio.

## Getting Started

1. Clone from Github

```
git clone https://github.com/codedthemes/datta-able-free-angular-admin-template.git
```

2. Install packages

```
yarn
```

3. Run project

```
yarn start
```

## Documentation

[Datta Able Angular Documentation](https://codedthemes.gitbook.io/datta-angular/) helps you with installation, deployment, and troubleshooting.

## Technology Stack

- Bootstrap 5
- Angular 18

## Author

Datta Able is developed by Team [CodedThemes](https://codedthemes.com).

## Issues

To report a bug, please submit an [issue](https://github.com/codedthemes/datta-able-free-angular-admin-template/issues) on Github. We will respond as soon as possible to resolve the issue.

## License

- Licensed cover under [MIT](https://github.com/codedthemes/datta-able-free-angular-admin-template/blob/master/LICENSE)

## Datta Able - React version

- [Free](https://lite.codedthemes.com/datta-able/react/default/dashboard/default)
- [Premium](https://codedthemes.com/item/datta-able-react-admin-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)

## More Free Angular Dashboard Templates

- [Mantis Angular](https://codedthemes.com/item/mantis-angular-free-admin-template/)
- [Gradient Able Angular](https://codedthemes.com/item/gradient-able-angular-free-admin-template/)
- [Next Angular](https://codedthemes.com/item/next-free-admin-template/)
- [Berry Angular](https://codedthemes.com/item/berry-angular-free-admin-template/)

## More Premium Angular Dashboard Templates

- [Mantis Angular Pro](https://codedthemes.com/item/mantis-angular-admin-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)
- [Gradient Able Angular Pro](https://codedthemes.com/item/gradient-able-angular-admin-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)
- [Next Angular Pro](https://codedthemes.com/item/next-angular-admin-template/)
- [Berry Angular Pro](https://codedthemes.com/item/berry-angular-admin-dashboard-template/?utm_source=free_demo&utm_medium=codedthemes&utm_campaign=button_download_premium)

## Follow us

- Website [https://codedthemes.com/demos/admin-templates/datta-able/angular/default](https://codedthemes.com/demos/admin-templates/datta-able/angular/default)
- Blog [https://blog.codedthemes.com/](https://blog.codedthemes.com/)
- CodedThemes [https://codedthemes.com](https://codedthemes.com)
- Dribbble [https://dribbble.com/codedthemes](https://dribbble.com/codedthemes)
- Facebook [https://www.facebook.com/codedthemes](https://www.facebook.com/codedthemes)
- Twitter [https://twitter.com/codedthemes](https://twitter.com/codedthemes)

## Atención veterinaria y tarifas

El Administrador gestiona vigencias e historial de precios desde Especializaciones.
El médico abre una cita propia en el Calendario médico y elige Ver atención clínica.
Desde allí puede consultar antecedentes, guardar el diagnóstico, registrar servicios,
crear fórmulas de varios medicamentos y descargar los PDF. La prefactura se
habilita al finalizar. Fórmulas reúne las fórmulas clínicas y el acceso a PDF
de las fórmulas anteriores.

Usa npm test -- --watch=false --browsers=ChromeHeadless para ejecutar las
pruebas y npm run build -- --configuration production para compilar la aplicación.

## Despacho de Medicamentos

El perfil Despacho Médico abre Despacho de Medicamentos desde el menú. Puede
buscar una fórmula confirmada, ingresar las cantidades por lote, sugerir FEFO,
revisar el resumen y confirmar la entrega. La preparación conserva el stock.
Historial de entregas permite filtrar por fecha y descargar el comprobante PDF.
La reversión exige motivo y confirmación de la devolución.

## Facturación

Administración y Recepción abren Facturación desde el menú. En Nueva factura,
seleccionan una atención finalizada y revisan los conceptos e importes
calculados por Spring. Recepción emite sin descuento. Administración puede
aplicar un descuento con motivo y anular facturas sin pagos. La pantalla
permite registrar abonos y usar el saldo vigente como importe del pago.

## Reportes

Abre Reportes desde el menú y selecciona un informe. Consulta el período
y los filtros aplicables antes de descargar PDF o Excel. Administración
tiene acceso financiero, médico e inventario. Recepción ve el resumen
operativo de citas. Las descargas incluyen el conjunto filtrado completo.
