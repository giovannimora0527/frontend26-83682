import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { Despacho, DespachoDetalle, DespachoFormula } from 'src/app/models/despacho';
import { Rol } from 'src/app/models/estados';
import { nuevoUuid } from 'src/app/shared/utils/uuid.util';
import { crearTokenPrueba } from 'src/app/testing/jwt.testing';
import { environment } from 'src/environments/environment';
import { BandejaComponent } from './bandeja/bandeja.component';
import { DespachoModalComponent } from './despacho-modal/despacho-modal.component';
import { estadoEsperado } from './despacho.util';
import { HistorialMedicamentoComponent } from './historial-medicamento/historial-medicamento.component';
import { LogDespachosComponent } from './log-despachos/log-despachos.component';
import { PreparacionComponent } from './preparacion/preparacion.component';

describe('Despacho', () => {
  const api = `${environment.apiUrlAuth}/despacho`;
  let http: HttpTestingController;
  let alerta: jasmine.Spy;
  const swal = (isConfirmed: boolean, value?: string) => ({ isConfirmed, isDenied: false, isDismissed: !isConfirmed, value });
  const detalle: DespachoDetalle = {
    formulaDetalleId: 11, medicamentoId: 5, codigo: 'AMX00500', nombre: 'Amoxicilina', dosis: 1, unidadDosis: 'tableta', frecuenciaHoras: 8, duracionDias: 7,
    viaAdministracion: 'ORAL', indicaciones: null, cantidadPrescrita: 100, cantidadDespachada: 0, cantidadPendiente: 100, existenciaTotalVigente: 180,
    puedeEntregarse: true, lotes: [
      { loteId: 1, numeroLote: 'A', fechaVencimiento: '2099-01-01', cantidadDisponible: 80, vencido: false, proximoVencer: true, cantidadSugerida: 80 },
      { loteId: 2, numeroLote: 'B', fechaVencimiento: '2099-09-01', cantidadDisponible: 100, vencido: false, proximoVencer: false, cantidadSugerida: 20 },
      { loteId: 3, numeroLote: 'V', fechaVencimiento: '2020-01-01', cantidadDisponible: 50, vencido: true, proximoVencer: false, cantidadSugerida: 0 }
    ]
  };
  const agotado: DespachoDetalle = { ...detalle, formulaDetalleId: 12, medicamentoId: 6, nombre: 'Ivermectina', cantidadPrescrita: 1, cantidadPendiente: 1, existenciaTotalVigente: 0, puedeEntregarse: false, lotes: [] };
  const datos: DespachoFormula = {
    formulaId: 4, despachoId: 9, despachoNumero: 'DP-000009', usuarioPreparacion: 'despacho', numero: 'FM-000004', fecha: '2026-11-24T10:00:00', medicoNombre: 'Ana',
    clienteNombre: 'Juan', clienteDocumento: '1', mascotaNombre: 'Luna', indicacionesGenerales: null, estadoDespacho: 'EN_PREPARACION', detalles: [detalle, agotado]
  };
  const despacho: Despacho = {
    id: 9, numero: 'DP-000009', formulaId: 4, formulaNumero: 'FM-000004', fecha: '2026-11-24T10:00:00', fechaInicio: '2026-11-24T10:00:00', mascotaNombre: 'Luna',
    clienteNombre: 'Juan', medicoNombre: 'Ana', usuario: 'despacho', estado: 'CONFIRMADO', estadoDespacho: 'DESPACHO_PARCIAL', observacion: null, revertido: false,
    fechaReversion: null, usuarioReversion: null, motivoReversion: null, sinExistencias: ['Ivermectina'],
    items: [{ formulaDetalleId: 11, medicamentoId: 5, medicamentoNombre: 'Amoxicilina', loteId: 1, numeroLote: 'A', fechaVencimiento: null, cantidad: 80, facturado: false }]
  };

  function iniciarSesion(rol: Rol = 'DESPACHO_MEDICO', username = 'despacho'): void {
    sessionStorage.setItem('token', crearTokenPrueba({ rol, username }));
  }

  beforeEach(() => {
    alerta = spyOn(Swal, 'fire').and.resolveTo(swal(true, ' Motivo '));
    iniciarSesion();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ formulaId: '4' })) } },
        { provide: NgbActiveModal, useValue: jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']) }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => sessionStorage.removeItem('token'));

  it('genera UUID v4, también sin crypto.randomUUID', () => {
    const formato = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(nuevoUuid()).toMatch(formato);
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    expect(nuevoUuid()).toMatch(formato);
    Reflect.deleteProperty(crypto, 'randomUUID');
  });

  it('calcula el estado esperado según la tabla de reglas', () => {
    const solo = [detalle];
    expect(estadoEsperado(solo, new Map([[11, 100]]))).toBe('DESPACHADO');
    expect(estadoEsperado(solo, new Map([[11, 40]]))).toBe('DESPACHO_PARCIAL');
    expect(estadoEsperado([{ ...detalle, cantidadDespachada: 10, cantidadPendiente: 90 }], new Map())).toBe('DESPACHO_PARCIAL');
    expect(estadoEsperado(solo, new Map())).toBe('PENDIENTE_DESPACHO');
    expect(estadoEsperado([agotado], new Map())).toBe('PENDIENTE_DISPONIBILIDAD');
  });

  describe('preparación', () => {
    function abrir(respuesta = datos) {
      const fixture = TestBed.createComponent(PreparacionComponent);
      http.expectOne(`${api}/formula/4`).flush(respuesta);
      fixture.detectChanges();
      return fixture;
    }
    const boton = (raiz: HTMLElement, texto: string) => Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto);
    const confirmarHttp = () => http.expectOne(`${api}/9/confirmar`);

    it('propone la sugerencia FEFO y bloquea los lotes vencidos', () => {
      const fixture = abrir();
      const entradas = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type=number]'));
      expect(entradas.map(({ value, disabled }) => [value, disabled])).toEqual([['80', false], ['20', false], ['0', true]]);
      expect(fixture.nativeElement.textContent).toContain('Próximo a vencer');
      expect(fixture.nativeElement.textContent).toContain('Se entregarán 1 de 2 medicamentos; quedará en estado: Despacho parcial.');
    });

    for (const [caso, lote, cantidad] of [['más que el lote', 0, 81], ['más que lo pendiente', 1, 21], ['negativos', 0, -1], ['decimales', 0, 1.5], ['vacío', 0, null]] as const) {
      it(`no permite ${caso} y deshabilita confirmar`, async () => {
        const fixture = abrir();
        const c = fixture.componentInstance;
        c.control(0, lote).setValue(cantidad);
        fixture.detectChanges();
        expect(boton(fixture.nativeElement, 'Confirmar despacho')?.disabled).toBeTrue();
        expect(c.impedimento).not.toBe('');
        await c.confirmar();
        expect(alerta).not.toHaveBeenCalled();
      });
    }

    it('restablece la sugerencia y permite entregar 0', () => {
      const c = abrir().componentInstance;
      c.entregarCero(0);
      expect(c.entrega(0)).toBe(0);
      expect(c.impedimento).toContain('Hay existencias por entregar');
      c.usarSugerencia(0);
      expect(c.entrega(0)).toBe(100);
    });

    it('sin existencias de lo pendiente se puede confirmar sin ítems', async () => {
      const c = abrir({ ...datos, detalles: [agotado] }).componentInstance;
      expect([c.impedimento, c.estadoPrevisto]).toEqual(['', 'PENDIENTE_DISPONIBILIDAD']);
      await c.confirmar();
      expect(confirmarHttp().request.body).toEqual({ observacion: null, items: [] });
    });

    it('confirma una sola vez con Idempotency-Key, solo los lotes con cantidad, y se bloquea mientras envía', async () => {
      const fixture = abrir();
      const c = fixture.componentInstance;
      await Promise.all([c.confirmar(), c.confirmar()]);
      const solicitud = confirmarHttp();
      expect(solicitud.request.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
      expect(solicitud.request.body).toEqual({
        observacion: null, items: [{ formulaDetalleId: 11, loteId: 1, cantidad: 80 }, { formulaDetalleId: 11, loteId: 2, cantidad: 20 }]
      });
      fixture.detectChanges();
      expect(boton(fixture.nativeElement, 'Procesando...')?.disabled).toBeTrue();
      solicitud.flush({ status: 200, message: 'ok', data: despacho });
      http.expectOne(`${api}/formula/4`).flush({ ...datos, despachoId: null, usuarioPreparacion: null, estadoDespacho: 'DESPACHO_PARCIAL' });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Sin existencias: Ivermectina');
      expect(boton(fixture.nativeElement, 'Comprobante PDF')).toBeTruthy();
    });

    it('reutiliza la clave tras un error de red y usa otra tras una respuesta definitiva', async () => {
      const c = abrir().componentInstance;
      const claves: (string | null)[] = [];
      for (const estado of [0, 503, 409, 200]) {
        await c.confirmar();
        const solicitud = confirmarHttp();
        claves.push(solicitud.request.headers.get('Idempotency-Key'));
        if (estado === 0) {
          solicitud.error(new ProgressEvent('error'));
          expect(c.respuestaError).toContain('no se descontará otra vez');
        } else {
          solicitud.flush({ message: 'x' }, { status: estado, statusText: 'x' });
        }
        http.match(`${api}/formula/4`).forEach((recarga) => recarga.flush(datos));
      }
      expect(claves[0]).toBe(claves[1]);
      expect(claves[1]).toBe(claves[2]);
      expect(claves[3]).not.toBe(claves[2]);
    });

    it('marca la fila del lote que falló, recarga los lotes y conserva lo escrito', async () => {
      const fixture = abrir();
      const c = fixture.componentInstance;
      c.control(0, 0).setValue(0);
      c.control(0, 1).setValue(30);
      await c.confirmar();
      confirmarHttp().flush(
        { message: 'No se despachó nada', detalles: [{ campo: 'items[0]', mensaje: 'El lote B solo tiene 10.' }] }, { status: 409, statusText: 'x' });
      http.expectOne(`${api}/formula/4`).flush({ ...datos, detalles: [{ ...detalle, lotes: detalle.lotes.map((l) => l.loteId === 2 ? { ...l, cantidadDisponible: 10 } : l) }, agotado] });
      fixture.detectChanges();
      const marcadas = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr.table-danger'));
      expect(marcadas.length).toBe(1);
      expect(marcadas[0].textContent).toContain('El lote B solo tiene 10.');
      expect(c.control(0, 1).value).toBe(30);
      expect(c.control(0, 1).hasError('max')).toBeTrue();
      // Lo escrito en pantalla debe llegar a los controles nuevos.
      const entrada: HTMLInputElement = marcadas[0].querySelector('input')!;
      entrada.value = '5';
      entrada.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(c.control(0, 1).value).toBe(5);
      expect(fixture.nativeElement.querySelector('tr.table-danger')).toBeNull();
    });

    it('si la prepara otro, muestra quién y no permite editar', () => {
      const raiz: HTMLElement = abrir({ ...datos, usuarioPreparacion: 'otro' }).nativeElement;
      expect(raiz.textContent).toContain('La está preparando otro');
      expect(raiz.querySelector('input[type=number]')).toBeNull();
      expect(boton(raiz, 'Confirmar despacho')).toBeUndefined();
      expect(boton(raiz, 'Cancelar despacho')).toBeUndefined();
    });

    it('al iniciar, el 409 muestra el nombre de quien prepara y recarga', () => {
      const c = abrir({ ...datos, despachoId: null, usuarioPreparacion: null, estadoDespacho: 'PENDIENTE_DESPACHO' }).componentInstance;
      c.preparar();
      http.expectOne(`${api}/formula/4/preparar`).flush({ message: 'La fórmula la está preparando maria.' }, { status: 409, statusText: 'x' });
      http.expectOne(`${api}/formula/4`).flush({ ...datos, usuarioPreparacion: 'maria' });
      expect(c.respuestaError).toContain('maria');
      expect(c.esMia).toBeFalse();
    });

    it('libera y cancela con confirmación; con entregas no deja cancelar', async () => {
      const c = abrir().componentInstance;
      await c.liberar();
      http.expectOne(`${api}/9/liberar`).flush({ status: 200, message: 'ok', data: { ...datos, despachoId: null, usuarioPreparacion: null } });
      expect(c.enCurso).toBeFalse();
      await c.cancelar();
      expect(http.expectOne(`${api}/formula/4/cancelar`).request.body).toEqual({ motivo: 'Motivo' });
      expect(abrir({ ...datos, detalles: [{ ...detalle, cantidadDespachada: 1 }] }).componentInstance.cancelable).toBeFalse();
    });

    it('muestra el historial de estados', () => {
      const fixture = abrir();
      fixture.componentInstance.pestana = 'historial';
      fixture.componentInstance.cambiarPestana('historial');
      http.expectOne(`${api}/formula/4/historial-estados`).flush([{
        id: 1, estadoAnterior: null, estadoNuevo: 'PENDIENTE_DESPACHO', estadoFormulaAnterior: 'BORRADOR', estadoFormulaNuevo: 'CONFIRMADA', motivo: null, usuario: 'medico1',
        fecha: '2026-11-24T10:00:00'
      }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Borrador');
      expect(fixture.nativeElement.textContent).toContain('medico1');
    });
  });

  it('la bandeja busca en el backend con espera y se refresca cada minuto', fakeAsync(() => {
    const c = TestBed.createComponent(BandejaComponent).componentInstance;
    http.expectOne(`${api}/formulas-pendientes`).flush([]);
    c.filtro.texto = 'lu';
    c.buscar();
    c.filtro.texto = 'luna';
    c.buscar();
    tick(400);
    http.expectOne(`${api}/formulas-pendientes?texto=luna`).flush([]);
    c.filtrarFechas({ desde: '2026-11-01', hasta: '2026-11-30' });
    http.expectOne(`${api}/formulas-pendientes?texto=luna&desde=2026-11-01&hasta=2026-11-30`).flush([]);
    tick(60_000);
    http.expectOne(`${api}/formulas-pendientes?texto=luna&desde=2026-11-01&hasta=2026-11-30`);
    discardPeriodicTasks();
  }));

  it('el log filtra por estado y muestra medicamentos, cantidades y lotes', () => {
    const fixture = TestBed.createComponent(LogDespachosComponent);
    http.expectOne(`${api}/historial`).flush([despacho]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Amoxicilina: 80 (lote A)');
    fixture.componentInstance.filtro.estado = 'REVERTIDO';
    fixture.componentInstance.listar();
    http.expectOne(`${api}/historial?estado=REVERTIDO`);
  });

  it('consulta el historial por medicamento', () => {
    const c = TestBed.createComponent(HistorialMedicamentoComponent).componentInstance;
    http.expectOne(`${environment.apiUrlAuth}/inventario/productos`).flush([]);
    c.seleccionado = { id: 5, codigo: 'AMX00500', nombre: 'Amoxicilina' } as never;
    c.listar();
    http.expectOne(`${api}/medicamento/5/historial`).flush([{ fecha: 'x' }]);
    expect(c.tabla.items.length).toBe(1);
  });

  describe('detalle del despacho', () => {
    function abrir(cambios: Partial<Despacho> = {}) {
      const fixture = TestBed.createComponent(DespachoModalComponent);
      fixture.componentInstance.despacho = { ...despacho, ...cambios };
      fixture.detectChanges();
      return fixture;
    }
    const texto = (raiz: HTMLElement) => raiz.querySelector('.modal-footer')?.textContent ?? '';

    it('solo ADMINISTRADOR ve Revertir', () => {
      expect(texto(abrir().nativeElement)).not.toContain('Revertir');
      iniciarSesion('ADMINISTRADOR', 'admin');
      expect(texto(abrir().nativeElement)).toContain('Revertir despacho');
    });

    it('no ofrece revertir lo facturado, lo revertido ni lo que no entregó nada', () => {
      iniciarSesion('ADMINISTRADOR', 'admin');
      expect(texto(abrir({ items: [{ ...despacho.items[0], facturado: true }] }).nativeElement)).toContain('tiene medicamentos facturados');
      for (const cambios of [{ estado: 'REVERTIDO' as const, revertido: true }, { items: [] }]) {
        expect(texto(abrir(cambios).nativeElement)).not.toContain('Revertir despacho');
      }
    });

    it('revierte con motivo', async () => {
      iniciarSesion('ADMINISTRADOR', 'admin');
      const c = abrir().componentInstance;
      await c.revertir();
      const solicitud = http.expectOne(`${api}/9/revertir`);
      expect(solicitud.request.body).toEqual({ motivo: 'Motivo' });
      solicitud.flush({ status: 200, message: 'ok' });
      expect(c.modal.close).toHaveBeenCalledOnceWith(true);
    });
  });
});
