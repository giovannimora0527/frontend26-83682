import { NavigationItems } from './theme/layout/admin/navigation/navigation';
import { menuGuard } from './guards/menu.guard';
import { authGuard } from './guards/auth.guard';
import { routes } from './app-routing.module';

describe('Rutas', () => {
  it('cada opción del menú tiene su ruta protegida por authGuard y menuGuard', () => {
    const inicio = routes.find((ruta) => ruta.path === 'inicio');
    const menus = NavigationItems.flatMap((grupo) => grupo.children ?? []).map((item) => item.id);
    const hijas = inicio?.children?.filter((ruta) => ruta.component) ?? [];
    expect(inicio?.canActivateChild).toContain(authGuard);
    expect(hijas.map((ruta) => ruta.data?.['menu'])).toEqual(menus);
    expect(hijas.every((ruta) => ruta.canActivate?.includes(menuGuard) && ruta.path === ruta.data?.['menu'])).toBeTrue();
  });
});
