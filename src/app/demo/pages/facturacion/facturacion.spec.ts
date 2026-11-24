import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Rol } from 'src/app/models/estados';
import { Factura, FacturaDetalle, FacturaPrevia } from 'src/app/models/factura';
import { crearTokenPrueba } from 'src/app/testing/jwt.testing';
import { environment } from 'src/environments/environment';
import { FacturaModalComponent } from './factura-modal/factura-modal.component';
import { aplicarDescuento, redondear, totalizar } from './factura.util';
import { GenerarFacturaComponent } from './generar-factura/generar-factura.component';
import { HistorialFacturasComponent } from './historial-facturas/historial-facturas.component';
import { ListaFacturasComponent } from './lista-facturas/lista-facturas.component';

describe('Facturación', () => {
  const api = `${environment.apiUrlAuth}/factura`;
  let http: HttpTestingController;
  let modal: jasmine.SpyObj<NgbActiveModal>;
  let alerta: jasmine.Spy;
  const swal = (isConfirmed: boolean, value?: string) => ({ isConfirmed, isDenied: false, isDismissed: !isConfirmed, value });
  const detalle: FacturaDetalle = {
    itemRef: 'SERVICIO-1', tipoItem: 'SERVICIO', descripcion: 'Consulta', cantidad: 1, precioUnitario: 50000, subtotal: 50000, porcentajeDescuento: 0, valorDescuento: 0,
    motivoDescuento: null, porcentajeIva: 19, valorIva: 9500, total: 59500
  };
  const jeringa: FacturaDetalle = { ...detalle, itemRef: 'MEDICAMENTO-2', tipoItem: 'MEDICAMENTO', descripcion: 'Jeringa', cantidad: 2, precioUnitario: 900 };
  const previa: FacturaPrevia = {
    citaId: 8, fechaCita: '2026-11-24T10:00:00', clienteId: 1, clienteNombre: 'Juan', clienteDocumento: '1', mascotaId: 1, mascotaNombre: 'Luna', medicoNombre: 'Ana',
    especialidadNombre: 'General', detalles: [detalle, jeringa], subtotal: 51800, descuentos: 0, iva: 9842, total: 61642, topeDescuento: 10,
    advertencias: ['Hay medicamentos pendientes de despacho: los no despachados no se facturan.']
  };
  const factura: Factura = {
    id: 3, numero: 'FV-000003', fecha: '2026-11-24T10:00:00', citaId: 8, clienteId: 1, clienteNombre: 'Juan', clienteDocumento: '1', mascotaId: 1, mascotaNombre: 'Luna',
    medicoNombre: 'Ana', especialidadNombre: 'General', subtotal: 100, descuentos: 0, iva: 0, total: 100, pagado: 40, saldo: 60, estado: 'PAGO_PARCIAL', observacion: null,
    detalles: [detalle], pagos: []
  };

  beforeEach(() => {
    modal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    alerta = spyOn(Swal, 'fire').and.resolveTo(swal(true, ' Error '));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: NgbActiveModal, useValue: modal }]
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => sessionStorage.removeItem('token'));

  it('redondea HALF_UP a dos decimales', () => {
    expect([1.005, 2.675, 0.125, 10].map(redondear)).toEqual([1.01, 2.68, 0.13, 10]);
  });

  it('calcula el IVA sobre la base con descuento y los totales', () => {
    const renglones = [aplicarDescuento(detalle, 10), aplicarDescuento(jeringa, 0)];
    expect(renglones[0]).toEqual(jasmine.objectContaining({ valorDescuento: 5000, valorIva: 8550, total: 53550 }));
    expect(totalizar(renglones)).toEqual({ subtotal: 51800, descuentos: 5000, iva: 8892, total: 55692 });
    expect(aplicarDescuento(detalle, 100).total).toBe(0);
  });

  describe('generar', () => {
    function abrir(respuesta = previa) {
      const fixture = TestBed.createComponent(GenerarFacturaComponent);
      fixture.componentInstance.citaId = 8;
      fixture.detectChanges();
      http.expectOne(`${api}/previsualizar/8`).flush(respuesta);
      fixture.detectChanges();
      return fixture;
    }

    it('muestra las advertencias y el aviso de lo despachado después', () => {
      const texto = abrir().nativeElement.textContent;
      expect(texto).toContain('pendientes de despacho');
      expect(texto).toContain('Lo que se despache después');
    });

    it('respeta el tope y exige motivo', async () => {
      const c = abrir().componentInstance;
      c.renglones.at(0).patchValue({ porcentaje: 11, motivo: 'x' });
      await c.generar();
      c.renglones.at(0).patchValue({ porcentaje: 10, motivo: ' ' });
      await c.generar();
      expect(alerta).not.toHaveBeenCalled();
      expect(c.totales.descuentos).toBe(5000);
    });

    it('envía solo los renglones con descuento, una vez, y cierra con la factura', async () => {
      const c = abrir().componentInstance;
      c.renglones.at(1).patchValue({ porcentaje: 5, motivo: ' Cortesía ' });
      await Promise.all([c.generar(), c.generar()]);
      const solicitud = http.expectOne(`${api}/generar`);
      expect(solicitud.request.body).toEqual({ citaId: 8, observacion: null, descuentos: [{ itemRef: 'MEDICAMENTO-2', porcentaje: 5, motivo: 'Cortesía' }] });
      solicitud.flush({ status: 200, message: 'ok', data: factura });
      expect(modal.close).toHaveBeenCalledOnceWith(factura);
    });

    it('marca el renglón que rechazó el backend y muestra el 409 de tarifa', async () => {
      const c = abrir({ ...previa, topeDescuento: 100 }).componentInstance;
      c.renglones.at(1).patchValue({ porcentaje: 50, motivo: 'x' });
      await c.generar();
      http.expectOne(`${api}/generar`).flush({ message: 'Supera el tope', detalles: [{ campo: 'descuentos[0].porcentaje', mensaje: 'Máximo 10 %' }] }, { status: 409, statusText: 'x' });
      expect(c.renglones.at(1).controls.porcentaje.errors).toEqual({ servidor: 'Máximo 10 %' });
      c.renglones.at(1).patchValue({ porcentaje: null, motivo: '' });
      await c.generar();
      http.expectOne(`${api}/generar`).flush({ message: 'El servicio Consulta no tiene tarifa vigente.' }, { status: 409, statusText: 'x' });
      expect(c.respuestaError).toContain('no tiene tarifa vigente');
    });

    it('avisa que con 100 % nace pagada', async () => {
      const c = abrir({ ...previa, detalles: [detalle], topeDescuento: 100 }).componentInstance;
      c.renglones.at(0).patchValue({ porcentaje: 100, motivo: 'Cortesía' });
      await c.generar();
      expect(alerta.calls.mostRecent().args[0].text).toContain('nacerá pagada');
    });
  });

  describe('detalle', () => {
    function abrir(cambios: Partial<Factura> = {}, rol: Rol = 'SECRETARIA') {
      sessionStorage.setItem('token', crearTokenPrueba({ rol }));
      const fixture = TestBed.createComponent(FacturaModalComponent);
      fixture.componentInstance.facturaId = 3;
      fixture.componentInstance.pagando = true;
      fixture.detectChanges();
      http.expectOne(`${api}/3`).flush({ ...factura, ...cambios });
      http.expectOne(`${api}/3/historial-estados`).flush([]);
      fixture.detectChanges();
      return fixture;
    }

    it('no permite pagar más que el saldo, cero ni sin referencia salvo en efectivo', () => {
      const c = abrir().componentInstance;
      for (const valor of [60.01, 0, -1, 1.234]) {
        c.form.setValue({ valor, medioPago: 'EFECTIVO', referencia: '' });
        c.pagar();
      }
      c.form.setValue({ valor: 60, medioPago: 'TRANSFERENCIA', referencia: ' ' });
      c.pagar();
      http.expectNone(`${api}/3/pagos`);
      c.form.controls.medioPago.setValue('EFECTIVO');
      expect(c.form.valid).toBeTrue();
    });

    it('paga el saldo completo y recarga la factura', () => {
      const c = abrir().componentInstance;
      c.pagarSaldo();
      c.form.patchValue({ medioPago: 'TARJETA_DEBITO', referencia: ' T-5 ' });
      c.pagar();
      c.pagar();
      const solicitud = http.expectOne(`${api}/3/pagos`);
      expect(solicitud.request.body).toEqual({ valor: 60, medioPago: 'TARJETA_DEBITO', referencia: 'T-5' });
      solicitud.flush({ status: 200, message: 'ok' });
      http.expectOne(`${api}/3`);
      expect(c.cambio).toBeTrue();
    });

    it('solo ADMINISTRADOR anula, con motivo, doble confirmación y el aviso del backend', async () => {
      expect(abrir().nativeElement.querySelector('.modal-footer').textContent).not.toContain('Anular');
      const fixture = abrir({}, 'ADMINISTRADOR');
      expect(fixture.nativeElement.querySelector('.modal-footer').textContent).toContain('Anular');
      await fixture.componentInstance.anular();
      expect(alerta.calls.mostRecent().args[0].text).toContain('que se conservan');
      const solicitud = http.expectOne(`${api}/3/anular`);
      expect(solicitud.request.body).toEqual({ motivo: 'Error' });
      solicitud.flush({ status: 200, message: 'Factura anulada. Tiene pagos por $ 40 que se conservan.' });
      expect(alerta.calls.mostRecent().args[1] as unknown).toContain('Tiene pagos por $ 40');
    });

    it('una factura pagada o anulada no admite pagos', () => {
      for (const estado of ['PAGADA', 'ANULADA'] as const) {
        expect(abrir({ estado }).componentInstance.admitePagos).toBeFalse();
      }
    });
  });

  it('lista con filtros en el backend', () => {
    const c = TestBed.createComponent(ListaFacturasComponent).componentInstance;
    http.expectOne(`${api}/listar`).flush([factura]);
    c.filtro.estado = 'PAGADA';
    c.filtrarFechas({ desde: '2026-11-01', hasta: '2026-11-30' });
    http.expectOne(`${api}/listar?desde=2026-11-01&hasta=2026-11-30&estado=PAGADA`);
  });

  it('el historial suma sin las anuladas', () => {
    const c = TestBed.createComponent(HistorialFacturasComponent).componentInstance;
    c.elegir({ item: { tipo: 'mascota', id: 1, texto: 'x' }, preventDefault: () => undefined });
    http.expectOne(`${api}/mascota/1`).flush([factura, { ...factura, id: 4, estado: 'ANULADA' }]);
    expect(c.totales).toEqual({ total: 100, pagado: 40, saldo: 60 });
  });
});
