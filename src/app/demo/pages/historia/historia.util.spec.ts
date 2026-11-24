import { leerAtencion } from './historia.util';

describe('leerAtencion', () => {
  it('separa los campos de una atención finalizada', () => {
    expect(leerAtencion({ descripcion: 'Motivo: Vómito\nSíntomas: Decaimiento\ny fiebre', observaciones: 'Estable\nRecomendaciones: Dieta' })).toEqual({
      motivo: 'Vómito', sintomas: 'Decaimiento\ny fiebre', observaciones: 'Estable', recomendaciones: 'Dieta'
    });
  });

  it('admite observaciones o recomendaciones vacías', () => {
    const descripcion = 'Motivo: A\nSíntomas: B';
    expect(leerAtencion({ descripcion, observaciones: 'Recomendaciones: Reposo' })?.observaciones).toBe('');
    expect(leerAtencion({ descripcion, observaciones: 'Reposo' })?.recomendaciones).toBe('');
    expect(leerAtencion({ descripcion, observaciones: null })?.observaciones).toBe('');
  });

  it('devuelve null para una anotación manual', () => {
    expect(leerAtencion({ descripcion: 'Control general', observaciones: 'x' })).toBeNull();
  });
});
