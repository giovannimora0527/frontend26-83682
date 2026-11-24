import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { construirParams, descargarArchivo, mensajeError } from './http.util';

describe('http.util', () => {
  it('omite los parámetros vacíos y conserva 0 y false', () => {
    expect(construirParams({ a: null, b: undefined, c: ' ', d: 0, e: false, f: 'x y' }).toString()).toBe('d=0&e=false&f=x%20y');
  });

  it('muestra el mensaje del backend con sus detalles', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { message: 'Datos inválidos', detalles: [{ campo: 'codigo', mensaje: 'Ya existe' }] }
    });
    expect(mensajeError(error, 'x')).toBe('Datos inválidos\ncodigo: Ya existe');
  });

  it('no repite un detalle que ya está en el mensaje', () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'Ya existe', detalles: [{ campo: 'codigo', mensaje: 'Ya existe' }] } });
    expect(mensajeError(error, 'x')).toBe('Ya existe');
  });

  it('usa el mensaje predeterminado si el cuerpo no tiene el formato esperado', () => {
    for (const cuerpo of [null, 'texto', {}, { message: 5 }]) {
      expect(mensajeError(new HttpErrorResponse({ status: 500, error: cuerpo }), 'Predeterminado')).toBe('Predeterminado');
    }
    expect(mensajeError(new Error('técnico'), 'Predeterminado')).toBe('Predeterminado');
  });

  for (const [encabezado, esperado] of [
    ['attachment; filename="factura-1.pdf"', /^factura-1\.pdf$/],
    ["attachment; filename=\"x.pdf\"; filename*=UTF-8''f%C3%B3rmula.pdf", /^fórmula\.pdf$/],
    [null, /^archivo-\d{4}-\d{2}-\d{2}\.pdf$/]
  ] as const) {
    it(`nombra la descarga con ${encabezado}`, () => {
      let nombre = '';
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
        nombre = this.download;
      });
      const headers = encabezado ? new HttpHeaders({ 'Content-Disposition': encabezado }) : new HttpHeaders();
      descargarArchivo(new HttpResponse({ body: new Blob(['x']), headers }), 'pdf');
      expect(nombre).toMatch(esperado);
    });
  }
});
