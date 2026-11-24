import { NavigationItems } from './theme/layout/admin/navigation/navigation';
import { menuGuard } from './guards/menu.guard';
import { authGuard } from './guards/auth.guard';
import { routes } from './app-routing.module';

describe('Rutas', () => {
  const inicio = routes.find((ruta) => ruta.path === 'inicio');
  const hijas = inicio?.children?.filter((ruta) => ruta.component) ?? [];

  it('cada opción del menú tiene su ruta protegida por authGuard y menuGuard', () => {
    const opciones = NavigationItems.flatMap((grupo) => grupo.children ?? []);
    expect(inicio?.canActivateChild).toContain(authGuard);
    expect(hijas.map((ruta) => [ruta.data?.['menu'], `/inicio/${ruta.path}`])).toEqual(opciones.map(({ id, url }) => [id, url]));
    expect(hijas.every((ruta) => ruta.canActivate?.includes(menuGuard))).toBeTrue();
  });

  it('la ruta citas usa el código de menú cita', () => {
    expect(hijas.find((ruta) => ruta.path === 'citas')?.data?.['menu']).toBe('cita');
  });
});
