import { cantidadSugerida } from './formula.util';

describe('cantidadSugerida', () => {
  for (const [dosis, frecuencia, dias, esperada] of [
    [1, 8, 7, 21], [0.5, 12, 5, 5], [1.5, 8, 1, 5], [0.1, 24, 3, 1], [1, 168, 1, 1], [0.07, 8, 100, 21], [2, 5, 1, 10]
  ]) {
    it(`${dosis} cada ${frecuencia} h por ${dias} días = ${esperada}`, () => {
      expect(cantidadSugerida(dosis, frecuencia, dias)).toBe(esperada);
    });
  }

  it('no calcula con datos incompletos o no positivos', () => {
    expect(cantidadSugerida(null, 8, 7)).toBeNull();
    expect(cantidadSugerida(1, 0, 7)).toBeNull();
    expect(cantidadSugerida(1, 8, -1)).toBeNull();
  });
});
