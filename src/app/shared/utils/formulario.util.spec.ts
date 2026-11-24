import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { marcarErroresServidor } from './formulario.util';

describe('marcarErroresServidor', () => {
  const crear = () => new FormGroup({ codigo: new FormControl(''), loteInicial: new FormGroup({ cantidad: new FormControl(1) }) });
  const error = (...campos: string[]) => new HttpErrorResponse({
    status: 409, error: { message: 'x', detalles: campos.map((campo) => ({ campo, mensaje: `Error ${campo}` })) }
  });

  it('marca campos directos, por ruta y dentro de grupos', () => {
    for (const campo of ['loteInicial.cantidad', 'cantidad']) {
      const form = crear();
      expect(marcarErroresServidor(form, error('codigo', campo))).toBeTrue();
      expect(form.controls.codigo.errors).toEqual({ servidor: 'Error codigo' });
      expect(form.controls.loteInicial.controls.cantidad.errors).toEqual({ servidor: `Error ${campo}` });
    }
  });

  it('devuelve false si algún detalle no tiene campo o no hay detalles', () => {
    expect(marcarErroresServidor(crear(), error('codigo', 'otro'))).toBeFalse();
    expect(marcarErroresServidor(crear(), error())).toBeFalse();
    expect(marcarErroresServidor(crear(), new Error('x'))).toBeFalse();
  });

  it('el error se borra al editar el campo', () => {
    const form = crear();
    marcarErroresServidor(form, error('codigo'));
    form.controls.codigo.setValue('nuevo');
    expect(form.valid).toBeTrue();
  });
});
