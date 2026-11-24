import { getJwtMenus } from 'src/app/utils/jwt.util';

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
/** Opciones del contrato (C4): el id es el código del menú y define la ruta. */
const opcion = (id: string, title: string, icon: string): NavigationItem => ({
  id,
  title,
  type: 'item',
  url: `/inicio/${id}`,
  icon,
  classes: 'nav-item'
});

export const NavigationItems: NavigationItem[] = [
  {
    id: 'administracion',
    title: 'Administración',
    type: 'group',
    icon: 'icon-settings',
    children: [
      opcion('usuarios', 'Usuarios', 'feather icon-users'),
      opcion('clientes', 'Clientes', 'bi bi-person-check'),
      opcion('medicos', 'Médicos', 'fa-solid fa-user-doctor'),
      opcion('especializaciones', 'Especializaciones', 'fa-solid fa-user-graduate'),
      opcion('tarifas', 'Tarifas', 'fa-solid fa-tags')
    ]
  },
  {
    id: 'agenda',
    title: 'Agenda y atención',
    type: 'group',
    icon: 'icon-calendar',
    children: [
      opcion('citas', 'Citas', 'bi bi-calendar'),
      opcion('calendario', 'Mi calendario', 'bi bi-calendar-week'),
      opcion('atencion', 'Atención médica', 'fa-solid fa-stethoscope'),
      opcion('historias', 'Historias clínicas', 'fa-solid fa-book-medical'),
      opcion('formulas', 'Fórmulas médicas', 'fa-solid fa-clipboard-list'),
      opcion('mascotas', 'Mascotas', 'fa-solid fa-paw')
    ]
  },
  {
    id: 'farmacia',
    title: 'Farmacia',
    type: 'group',
    icon: 'icon-package',
    children: [
      opcion('inventario', 'Inventario', 'fa-solid fa-boxes-stacked'),
      opcion('carga-inventario', 'Carga masiva', 'fa-solid fa-file-arrow-up'),
      opcion('despacho', 'Despacho', 'fa-solid fa-prescription-bottle-medical')
    ]
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    type: 'group',
    icon: 'icon-dollar-sign',
    children: [
      opcion('facturacion', 'Facturación', 'fa-solid fa-file-invoice-dollar'),
      opcion('reportes', 'Reportes', 'fa-solid fa-chart-column')
    ]
  }
];

export function getNavigationItems(): NavigationItem[] {
  let allowedCodes: Set<string>;
  try {
    allowedCodes = new Set(getJwtMenus().filter((menu) => menu.activo).map((menu) => menu.code));
  } catch (error) {
    console.error('No fue posible obtener los menus del token JWT', error);
    return [];
  }

  const filterItems = (items: NavigationItem[]): NavigationItem[] =>
    items.flatMap((item) => {
      if (item.type === 'item') {
        return allowedCodes.has(item.id) ? [{ ...item }] : [];
      }

      const children = filterItems(item.children ?? []);
      return children.length > 0 ? [{ ...item, children }] : [];
    });

  return filterItems(NavigationItems);
}
