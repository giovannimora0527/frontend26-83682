import { getNavigationItems, NavigationItems } from './navigation';

describe('getNavigationItems', () => {
  let previousToken: string | null;

  function storeMenus(codes: string[], inactiveCodes: string[] = []): void {
    const menus = codes.map((code) => ({ activo: !inactiveCodes.includes(code), code, name: 'token-name' }));
    const payload = {
      sub: '1',
      username: 'test',
      email: 'test@example.com',
      rol: 'Administrador',
      menus: JSON.stringify(menus),
      iat: 1793066869,
      exp: 1793070469
    };
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    sessionStorage.setItem('token', `eyJhbGciOiJIUzI1NiJ9.${encoded}.c2lnbmF0dXJl`);
  }

  beforeEach(() => {
    previousToken = sessionStorage.getItem('token');
    sessionStorage.removeItem('token');
  });

  afterEach(() => {
    if (previousToken === null) {
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', previousToken);
    }
  });

  it('shows no menus without a token', () => {
    expect(getNavigationItems()).toEqual([]);
  });

  const codigos = () => getNavigationItems().flatMap((grupo) => grupo.children?.map((item) => item.id) ?? []);

  it('filters by code, preserves catalog order and local menu metadata', () => {
    storeMenus(['despacho', 'usuarios', 'clientes', 'unknown']);
    const result = getNavigationItems();
    expect(result.map((grupo) => grupo.title)).toEqual(['Administración', 'Farmacia']);
    expect(codigos()).toEqual(['usuarios', 'clientes', 'despacho']);
    expect(result[0].children?.[0]).toEqual(NavigationItems[0].children?.[0]);
    expect(result[1].children?.[0].url).toBe('/inicio/despacho');
  });

  it('includes the sixteen contract menus when authorized', () => {
    const codes = ['clientes', 'mascotas', 'medicos', 'especializaciones', 'citas', 'calendario', 'atencion', 'historias', 'formulas',
      'inventario', 'carga-inventario', 'despacho', 'tarifas', 'facturacion', 'reportes', 'usuarios'];
    storeMenus(codes);
    expect(codigos().sort()).toEqual([...codes].sort());
    expect(getNavigationItems().map((grupo) => grupo.title)).toEqual(['Administración', 'Agenda y atención', 'Farmacia', 'Finanzas']);
  });

  it('excludes inactive menus and removes empty groups', () => {
    storeMenus(['citas', 'clientes'], ['citas']);
    expect(codigos()).toEqual(['clientes']);
    storeMenus(['citas'], ['citas']);
    expect(getNavigationItems()).toEqual([]);
    storeMenus([]);
    expect(getNavigationItems()).toEqual([]);
  });

  it('does not mutate the catalog or reuse previous permissions', () => {
    const original = JSON.stringify(NavigationItems);
    storeMenus(['citas']);
    const first = getNavigationItems();
    first[0].children[0].title = 'changed';
    storeMenus(['clientes']);
    expect(codigos()).toEqual(['clientes']);
    expect(JSON.stringify(NavigationItems)).toBe(original);
  });

  it('reports invalid tokens and fails closed', () => {
    const log = spyOn(console, 'error');
    sessionStorage.setItem('token', 'invalid');
    expect(getNavigationItems()).toEqual([]);
    expect(log).toHaveBeenCalledWith('No fue posible obtener los menus del token JWT', jasmine.any(Error));
  });

  it('filters nested collapses and removes empty ones without mutating them', () => {
    const catalog = NavigationItems[0].children;
    NavigationItems[0].children = [
      { id: 'nested', title: 'Nested', type: 'collapse', children: [catalog[0]] },
      { id: 'empty', title: 'Empty', type: 'collapse', children: [catalog[1]] }
    ];
    try {
      storeMenus(['usuarios']);
      const result = getNavigationItems()[0].children;
      expect(result.length).toBe(1);
      expect(result[0].children?.map((item) => item.id)).toEqual(['usuarios']);
    } finally {
      NavigationItems[0].children = catalog;
    }
  });
});
