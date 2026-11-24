import { filtrar, ordenar, paginar } from './tabla.util';

describe('tabla.util', () => {
  const lista = [{ n: 'Ñandú', v: 10 }, { n: 'águila', v: 2 }, { n: 'Búho', v: 5 }];

  it('filtra sin distinguir tildes, mayúsculas ni espacios', () => {
    expect(filtrar(lista, ' AGUILA ', (i) => [i.n])).toEqual([lista[1]]);
    expect(filtrar(lista, '', (i) => [i.n])).toEqual(lista);
    expect(filtrar([{ n: null }], 'null', (i) => [i.n])).toEqual([]);
  });

  it('ordena textos y números en ambos sentidos sin modificar la lista', () => {
    const copia = [...lista];
    expect(ordenar(lista, (i) => i.v, 'asc').map((i) => i.v)).toEqual([2, 5, 10]);
    expect(ordenar(lista, (i) => i.n, 'desc').map((i) => i.n)).toEqual(['Ñandú', 'Búho', 'águila']);
    expect(lista).toEqual(copia);
  });

  it('pagina y ajusta las páginas fuera de rango', () => {
    expect(paginar(lista, 2, 2)).toEqual({ items: [lista[2]], pagina: 2, totalPaginas: 2 });
    expect(paginar(lista, 9, 2).pagina).toBe(2);
    expect(paginar([], 1, 5)).toEqual({ items: [], pagina: 1, totalPaginas: 0 });
  });
});
