
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
  /** Identificador único del registro. */
  id: string;

  // Nombre que aparece en pantalla.
  /** Título visible. */
  title: string;

  // Tipo de elemento.
  /** Tipo de elemento del menú (item, collapse o group). */
  type: 'item' | 'collapse' | 'group';

  // Traducción opcional.
  /** Translate (opcional). */
  translate?: string;

  // Icono visual del menú.
  /** Clase del ícono (opcional). */
  icon?: string;

  // Permite ocultar un elemento.
  /** Indica si el elemento se oculta (opcional). */
  hidden?: boolean;

  // Ruta hacia el componente de Angular.
  /** Ruta de navegación (opcional). */
  url?: string;

  // Clases CSS.
  /** Clases CSS adicionales (opcional). */
  classes?: string;

  // Coincidencia exacta de la ruta.
  /** Indica si la ruta debe coincidir exactamente (opcional). */
  exactMatch?: boolean;

  // Identifica enlaces externos.
  /** Indica si el enlace abre un sitio externo (opcional). */
  external?: boolean;

  // Configuración del destino.
  /** Indica si se abre en otra pestaña (opcional). */
  target?: boolean;

  // Muestra la navegación de migas de pan.
  /** Indica si se muestra en las migas de pan (opcional). */
  breadcrumbs?: boolean;

  // Elementos secundarios.
  /** Elementos hijos del menú (opcional). */
  children?: NavigationItem[];
}

// ==========================================================
// 2. MENÚ PRINCIPAL DE LA CLÍNICA
// ==========================================================

/** Navigation items. */
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

      {
        id: 'reportes',
        title: 'Reportes',
        type: 'item',
        url: '/inicio/reportes',
        icon: 'feather icon-bar-chart-2',
        classes: 'nav-item'
      },
      {
        id: 'facturacion',
        title: 'Facturación',
        type: 'item',
        url: '/inicio/facturacion',
        icon: 'feather icon-file-text',
        classes: 'nav-item'
      },
      {
        id: 'despacho-medicamentos',
        title: 'Despacho de Medicamentos',
        type: 'item',
        url: '/inicio/despacho',
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
      }

    ]
  }

];
