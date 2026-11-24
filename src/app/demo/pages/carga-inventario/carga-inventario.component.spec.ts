import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { CargaInventario, FilaCarga } from 'src/app/models/carga-inventario';
import { environment } from 'src/environments/environment';
import { CargaInventarioComponent } from './carga-inventario.component';

describe('CargaInventarioComponent', () => {
  const api = `${environment.apiUrlAuth}/inventario/carga`;
  let fixture: ComponentFixture<CargaInventarioComponent>;
  let component: CargaInventarioComponent;
  let http: HttpTestingController;
  let alerta: jasmine.Spy;
  const fila = (numero: number, valida: boolean, extra: Partial<FilaCarga> = {}): FilaCarga => ({
    fila: numero, valida, accion: valida ? 'NUEVO_LOTE' : null, datos: { codigo: `COD0000${numero}`, precio_venta: '100' },
    errores: valida ? [] : [{ campo: 'precio_venta', mensaje: 'Debe ser mayor que 0' }], advertencias: [], importada: false, errorImportacion: null, ...extra
  });
  const carga: CargaInventario = {
    cargaId: 5, nombreArchivo: 'a.xlsx', formato: 'xlsx', estado: 'PREVISUALIZADA', totalFilas: 3, filasValidas: 2, filasConError: 1,
    filasImportadas: 0, usuario: 'admin', fecha: '2026-11-24T10:00:00', usuarioConfirmacion: null, fechaConfirmacion: null,
    filas: [fila(2, true), fila(3, false), fila(4, true)]
  };
  const archivo = (nombre = 'a.xlsx', contenido = 'x') => new File([contenido], nombre);
  const raiz = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    alerta = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } }
      ]
    });
    fixture = TestBed.createComponent(CargaInventarioComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  function previsualizar(respuesta = carga): void {
    component.validarArchivo(archivo());
    component.previsualizar();
    http.expectOne(`${api}/previsualizar`).flush(respuesta);
    fixture.detectChanges();
  }

  it('valida extensión, tamaño y contenido antes de enviar', () => {
    const grande = archivo('a.csv');
    Object.defineProperty(grande, 'size', { value: 5 * 1024 * 1024 + 1 });
    for (const [prueba, mensaje] of [[archivo('a.xls'), '.xlsx'], [archivo('a.csv', ''), 'vacío'], [grande, '5 MB'], [null, 'Selecciona']] as const) {
      component.validarArchivo(prueba);
      expect(component.errorArchivo).toContain(mensaje);
      component.previsualizar();
    }
    http.expectNone(`${api}/previsualizar`);
    component.validarArchivo(archivo('A.CSV'));
    expect(component.errorArchivo).toBe('');
  });

  it('envía FormData con el campo archivo', () => {
    const enviado = archivo();
    component.validarArchivo(enviado);
    component.previsualizar();
    const { body } = http.expectOne(`${api}/previsualizar`).request;
    expect(body instanceof FormData && (body.get('archivo') as File).name).toBe('a.xlsx');
  });

  it('pinta las válidas y las filas con error con su motivo', () => {
    previsualizar();
    const filas = Array.from(raiz().querySelectorAll('tbody tr'));
    expect(filas.map((f) => f.classList.contains('table-danger'))).toEqual([false, true, false]);
    expect(filas[1].textContent).toContain('precio_venta → Debe ser mayor que 0');
    const pulsar = (texto: string) => {
      Array.from(raiz().querySelectorAll('button')).find((b) => b.textContent?.startsWith(texto))?.click();
      fixture.detectChanges();
      return raiz().querySelectorAll('tbody tr').length;
    };
    expect(pulsar('Con error')).toBe(1);
    expect(pulsar('Válidas')).toBe(2);
    expect(pulsar('Todas')).toBe(3);
  });

  it('muestra qué encabezados fallan y permanece en el primer paso', () => {
    component.validarArchivo(archivo());
    component.previsualizar();
    http.expectOne(`${api}/previsualizar`).flush(
      { message: 'Encabezados inválidos. Faltan: codigo', detalles: [{ campo: 'sobran', mensaje: 'precio' }] }, { status: 400, statusText: 'x' });
    fixture.detectChanges();
    expect(component.paso).toBe(0);
    expect(raiz().querySelector('.alert-danger')?.textContent).toContain('Faltan: codigo\nsobran: precio');
  });

  it('confirma una sola vez y muestra las filas que fallaron al importar', async () => {
    previsualizar();
    component.paso = 2;
    const primera = component.confirmar();
    const segunda = component.confirmar();
    await Promise.all([primera, segunda]);
    expect(alerta.calls.mostRecent().args[0].text).toContain('Se importarán 2 registros válidos; los 1 con error');
    http.expectOne(`${api}/5/confirmar`).flush({
      status: 200, message: 'ok',
      data: {
        ...carga, estado: 'CONFIRMADA_CON_ERRORES', filasImportadas: 1,
        filas: [fila(2, true, { importada: true }), fila(3, false), fila(4, true, { errorImportacion: 'Lote repetido' })]
      }
    });
    fixture.detectChanges();
    expect(component.paso).toBe(3);
    expect(component.filasNoImportadas).toBe(1);
    expect(raiz().textContent).toContain('Lote repetido');
  });

  it('no confirma si el usuario cancela', async () => {
    alerta.and.resolveTo({ isConfirmed: false, isDenied: false, isDismissed: true });
    previsualizar();
    await component.confirmar();
    http.expectNone(`${api}/5/confirmar`);
    expect(component.procesando).toBeFalse();
  });

  it('descarta la carga y vuelve al inicio', async () => {
    previsualizar();
    await component.descartar();
    http.expectOne(`${api}/5/descartar`).flush({ status: 200, message: 'ok' });
    expect([component.paso, component.carga]).toEqual([0, null]);
  });

  it('no deja continuar sin filas válidas', () => {
    previsualizar({ ...carga, filasValidas: 0, filas: [fila(2, false)] });
    const continuar = Array.from(raiz().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Continuar');
    expect(continuar?.disabled).toBeTrue();
  });

  it('lista el historial con filtro y retoma una carga pendiente', () => {
    component.pestana = 'historial';
    component.cambiarPestana('historial');
    http.expectOne(`${api}/historial`).flush([carga]);
    fixture.detectChanges();
    expect(raiz().textContent).toContain('a.xlsx');
    component.filtrarHistorial({ desde: '2026-11-01', hasta: '2026-11-30' });
    http.expectOne(`${api}/historial?desde=2026-11-01&hasta=2026-11-30`).flush([]);
    component.verDetalle(5);
    http.expectOne(`${api}/5`).flush(carga);
    component.retomar(component.cargaDetalle!);
    expect([component.pestana, component.paso]).toEqual(['asistente', 1]);
  });
});
