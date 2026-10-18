
/**
 * ==========================================================
 * CLÍNICA VETERINARIA - UNIMINUTO
 * CONFIGURACIÓN DEL MENÚ LATERAL
 * ==========================================================
 *
 * Este archivo administra las opciones de navegación
 * que aparecen en el panel izquierdo de Angular.
 *
 * Cada una de las 12 tablas de MySQL tiene una opción.
 *
 * Los enlaces deben coincidir con las rutas definidas
 * en app-routing.module.ts.
 */

// ==========================================================
// 1. INTERFAZ DE NAVEGACIÓN
// ==========================================================

/**
 * Define las propiedades disponibles
 * para cada elemento del menú.
 */
export interface NavigationItem {

  // Identificador único.
  id: string;

  // Nombre que aparece en pantalla.
  title: string;

  // Tipo de elemento.
  type: 'item' | 'collapse' | 'group';

  // Traducción opcional.
  translate?: string;

  // Icono visual del menú.
  icon?: string;

  // Permite ocultar un elemento.
  hidden?: boolean;

  // Ruta hacia el componente de Angular.
  url?: string;

  // Clases CSS.
  classes?: string;

  // Coincidencia exacta de la ruta.
  exactMatch?: boolean;

  // Identifica enlaces externos.
  external?: boolean;

  // Configuración del destino.
  target?: boolean;

  // Muestra la navegación de migas de pan.
  breadcrumbs?: boolean;

  // Elementos secundarios.
  children?: NavigationItem[];
}

// ==========================================================
// 2. MENÚ PRINCIPAL DE LA CLÍNICA
// ==========================================================

export const NavigationItems: NavigationItem[] = [

  {
    // Grupo que contiene todos los módulos.
    id: 'navigation',
    title: 'Inicio',
    type: 'group',
    icon: 'icon-navigation',

    children: [

      // ====================================================
      // 1. GESTIÓN DE USUARIOS
      // Tabla: usuario
      // ====================================================
      {
        id: 'usuario',
        title: 'Gestión de Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },

      // ====================================================
      // 2. GESTIÓN DE CLIENTES
      // Tabla: cliente
      // ====================================================
      {
        id: 'clientes',
        title: 'Gestión de Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },

      // ====================================================
      // 3. GESTIÓN DE MASCOTAS
      // Tabla: mascota
      // ====================================================
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'feather icon-home',
        classes: 'nav-item'
      },

      // ====================================================
      // 4. GESTIÓN DE RAZAS
      // Tabla: raza
      // ====================================================
      {
        id: 'razas',
        title: 'Gestión de Razas',
        type: 'item',
        url: '/inicio/razas',
        icon: 'feather icon-list',
        classes: 'nav-item'
      },

      // ====================================================
      // 5. GESTIÓN DE MÉDICOS
      // Tabla: medico
      // ====================================================
      {
        id: 'medico',
        title: 'Gestión de Médicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-activity',
        classes: 'nav-item'
      },

      // ====================================================
      // 6. GESTIÓN DE ESPECIALIZACIONES
      // Tabla: especializacion
      // ====================================================
      {
        id: 'especializaciones',
        title: 'Gestión de Especializaciones',
        type: 'item',
        url: '/inicio/especializaciones',
        icon: 'feather icon-award',
        classes: 'nav-item'
      },

      // ====================================================
      // 7. GESTIÓN DE CITAS
      // Tabla: cita
      // ====================================================
      {
        id: 'citas',
        title: 'Gestión de Citas',
        type: 'item',
        url: '/inicio/citas',
        icon: 'feather icon-calendar',
        classes: 'nav-item'
      },

      // ====================================================
      // 8. GESTIÓN DE MEDICAMENTOS
      // Tabla: medicamento
      // ====================================================
      {
        id: 'medicamentos',
        title: 'Gestión de Medicamentos',
        type: 'item',
        url: '/inicio/medicamentos',
        icon: 'feather icon-package',
        classes: 'nav-item'
      },

      // ====================================================
      // 9. GESTIÓN DE FÓRMULAS MÉDICAS
      // Tabla: formula_medica
      // ====================================================
      {
        id: 'formulas',
        title: 'Gestión de Fórmulas',
        type: 'item',
        url: '/inicio/formulas',
        icon: 'feather icon-file-text',
        classes: 'nav-item'
      },

      // ====================================================
      // 10. GESTIÓN DE HISTORIAS MÉDICAS
      // Tabla: historia_medica
      // ====================================================
      {
        id: 'historias-medicas',
        title: 'Gestión de Historias Médicas',
        type: 'item',
        url: '/inicio/historias-medicas',
        icon: 'feather icon-clipboard',
        classes: 'nav-item'
      },

      // ====================================================
      // 11. GESTIÓN DE ANOTACIONES
      // Tabla: anotacion_historia
      // ====================================================
      {
        id: 'anotaciones',
        title: 'Gestión de Anotaciones',
        type: 'item',
        url: '/inicio/anotaciones',
        icon: 'feather icon-edit',
        classes: 'nav-item'
      },

      // ====================================================
      // 12. GESTIÓN DE SESIONES
      // Tabla: sesion
      // ====================================================
      {
        id: 'sesiones',
        title: 'Gestión de Sesiones',
        type: 'item',
        url: '/inicio/sesiones',
        icon: 'feather icon-clock',
        classes: 'nav-item'
      }

    ]
  }

];
