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
        title: 'Gestión de Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'bi bi-person-lines-fill',
        classes: 'nav-item'
      },
      /* ---------- Nuevos menus aqui -------------  */ 
      {
        id: 'medicos',
        title: 'Gestión de Medicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'formulas-medicas',
        title: 'Fórmulas Médicas',
        type: 'item',
        url: '/inicio/formulas-medicas',
        icon: 'feather icon-file-text',
        classes: 'nav-item'
      },
      {
        id: 'citas', title: 'Citas médicas', type: 'item', url: '/inicio/citas',
        icon: 'feather icon-calendar', classes: 'nav-item'
      },
      {
        id: 'historias-clinicas', title: 'Historias clínicas', type: 'item', url: '/inicio/historias-clinicas',
        icon: 'feather icon-activity', classes: 'nav-item'
      },
      {
        id: 'anotaciones', title: 'Anotaciones clínicas', type: 'item', url: '/inicio/anotaciones',
        icon: 'feather icon-edit', classes: 'nav-item'
      },
    ]
  },  
];
