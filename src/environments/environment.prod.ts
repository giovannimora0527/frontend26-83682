
/**
 * ====================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * CONFIGURACIÓN DEL ENTORNO DE PRODUCCIÓN
 * ====================================================
 *
 * Este archivo configura:
 *
 * 1. La versión de la aplicación.
 * 2. El modo de producción.
 * 3. La dirección del backend Spring Boot.
 *
 * IMPORTANTE:
 * Por ahora utilizamos localhost porque estamos
 * desarrollando y probando el sistema localmente.
 *
 * Al publicar la aplicación en un servidor,
 * será necesario cambiar esta dirección por
 * la URL real del backend.
 */

// Obtener la versión desde package.json.
import packageInfo from '../../package.json';

// Configuración de la aplicación Angular.
export const environment = {

  // Versión actual del proyecto.
  appVersion: packageInfo.version,

  // Indica que es una compilación de producción.
  production: true,

  // Dirección del backend Spring Boot.
  // Se utiliza en Mascotas, Clientes y Citas.
  apiUrlAuth: 'http://localhost:8080/clinica/v1'

};
