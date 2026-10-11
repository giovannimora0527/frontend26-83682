export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;

  children?: NavigationItem[];
}
export const NavigationItems: NavigationItem[] = [
  {
    id: 'navigation',
    title: 'Inicio',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'usuario',
        title: 'Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },
      {
        id: 'cliente',
        title: 'Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'mascota',
        title: 'Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'feather icon-home',
        classes: 'nav-item'
      },
      {
        id: 'raza',
        title: 'Razas',
        type: 'item',
        url: '/inicio/razas',
        icon: 'feather icon-heart',
        classes: 'nav-item'
      },
      {
        id: 'medico',
        title: 'Médicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-user-check',
        classes: 'nav-item'
      },
      {
        id: 'especializacion',
        title: 'Especializaciones',
        type: 'item',
        url: '/inicio/especializaciones',
        icon: 'feather icon-award',
        classes: 'nav-item'
      },
      {
        id: 'cita',
        title: 'Citas',
        type: 'item',
        url: '/inicio/citas',
        icon: 'feather icon-calendar',
        classes: 'nav-item'
      },
      {
        id: 'historia-medica',
        title: 'Historias médicas',
        type: 'item',
        url: '/inicio/historias-medicas',
        icon: 'feather icon-clipboard',
        classes: 'nav-item'
      },
      {
        id: 'anotacion-historia',
        title: 'Anotaciones',
        type: 'item',
        url: '/inicio/anotaciones',
        icon: 'feather icon-edit',
        classes: 'nav-item'
      },
      {
        id: 'medicamento',
        title: 'Medicamentos',
        type: 'item',
        url: '/inicio/medicamentos',
        icon: 'feather icon-package',
        classes: 'nav-item'
      },
      {
        id: 'formula-medica',
        title: 'Fórmulas médicas',
        type: 'item',
        url: '/inicio/formulas-medicas',
        icon: 'feather icon-file-text',
        classes: 'nav-item'
      }
      /* ---------- Nuevos menus aqui -------------  */
    ]
  },
];
