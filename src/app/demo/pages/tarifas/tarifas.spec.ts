import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Servicio } from 'src/app/models/servicio';
import { Tarifa } from 'src/app/models/tarifa';
import { environment } from 'src/environments/environment';
import { ConfiguracionClinicaComponent } from './configuracion-clinica/configuracion-clinica.component';
import { HistorialTarifasComponent } from './historial-tarifas/historial-tarifas.component';
import { ImpuestosComponent } from './impuestos/impuestos.component';
import { ListaTarifasComponent } from './lista-tarifas/lista-tarifas.component';
import { ServiciosComponent } from './servicios/servicios.component';

describe('Tarifas', () => {
  const api = environment.apiUrlAuth;
  const plantilla = {} as TemplateRef<unknown>;
  let http: HttpTestingController;
  let cerrar: jasmine.Spy;
  const servicio = { id: 1, codigo: 'CONS', nombre: 'Consulta', tipoServicio: 'CONSULTA', duracionMinutos: 30, activo: true, tarifaVigente: { id: 9 } } as Servicio;
  const tarifa: Tarifa = {
    id: 9, servicioId: 1, servicioCodigo: 'CONS', servicioNombre: 'Consulta', especializacionNombre: null, valor: 50000, impuestoId: 3,
    impuestoNombre: 'IVA 19 %', porcentajeIva: 19, vigenteDesde: '2026-01-01', vigenteHasta: null, activa: true
  };
  const impuestos = [
    { id: 1, nombre: 'IVA 0 %', porcentaje: 0, activo: true }, { id: 3, nombre: 'IVA 19 %', porcentaje: 19, activo: true },
    { id: 4, nombre: 'Libre', porcentaje: 8, activo: false }
  ];

  beforeEach(() => {
    cerrar = jasmine.createSpy('close');
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    spyOn(TestBed.inject(NgbModal), 'open').and.returnValue({ close: cerrar, dismiss: () => undefined } as never);
    http = TestBed.inject(HttpTestingController);
  });

  describe('lista', () => {
    function crear(servicios: Servicio[] = [servicio]) {
      const fixture = TestBed.createComponent(ListaTarifasComponent);
      http.expectOne(`${api}/tarifa/listar`).flush([tarifa, { ...tarifa, id: 8, activa: false, vigenteHasta: '2025-12-31' }]);
      http.expectOne(`${api}/servicio/listar`).flush(servicios);
      http.expectOne(`${api}/impuesto/listar`).flush(impuestos);
      fixture.detectChanges();
      return fixture.componentInstance;
    }

    it('muestra las vigentes y, si se pide, las cerradas', () => {
      const c = crear();
      expect(c.tabla.items.length).toBe(1);
      c.soloVigentes = false;
      c.filtrar();
      expect(c.tabla.items.length).toBe(2);
    });

    it('cambiar exige un cambio real y motivo, y recarga la lista', () => {
      const c = crear();
      c.abrir(tarifa, plantilla);
      c.form.controls.motivo.setValue('Ajuste');
      c.guardar();
      expect(c.respuestaError).toContain('Cambia el valor');
      c.form.patchValue({ valor: 60000, motivo: '  ' });
      c.guardar();
      http.expectNone(`${api}/tarifa/9`);
      c.form.controls.motivo.setValue(' Ajuste ');
      c.guardar();
      const solicitud = http.expectOne(`${api}/tarifa/9`);
      expect([solicitud.request.method, solicitud.request.body]).toEqual(['PUT', { valor: 60000, impuestoId: 3, motivo: 'Ajuste' }]);
      solicitud.flush({ status: 200, message: 'ok', data: { ...tarifa, id: 10 } });
      expect(cerrar).toHaveBeenCalled();
      http.expectOne(`${api}/tarifa/listar`);
    });

    it('crea solo para servicios activos sin tarifa y nunca a futuro', () => {
      const c = crear([servicio, { ...servicio, id: 2, tarifaVigente: null }, { ...servicio, id: 3, tarifaVigente: null, activo: false }]);
      expect(c.serviciosSinTarifa.map(({ id }) => id)).toEqual([2]);
      c.abrir(null, plantilla);
      c.form.patchValue({ servicioId: 2, valor: 1000, impuestoId: 1, vigenteDesde: '2999-01-01' });
      c.guardar();
      http.expectNone(`${api}/tarifa/crear`);
      expect(c.respuestaError).toContain('futuro');
      c.form.controls.vigenteDesde.setValue('2026-01-01');
      c.guardar();
      expect(http.expectOne(`${api}/tarifa/crear`).request.body).toEqual({ servicioId: 2, valor: 1000, impuestoId: 1, vigenteDesde: '2026-01-01' });
    });
  });

  describe('impuestos', () => {
    function crear() {
      const fixture = TestBed.createComponent(ImpuestosComponent);
      http.expectOne(`${api}/impuesto/listar`).flush(impuestos);
      http.expectOne(`${api}/tarifa/listar`).flush([tarifa]);
      http.expectOne(`${api}/inventario/productos`).flush([{ id: 1, impuestoId: 1 }]);
      fixture.detectChanges();
      return fixture.componentInstance;
    }

    it('bloquea el porcentaje si lo usa una tarifa o un producto', () => {
      const c = crear();
      expect(impuestos.map((impuesto) => { c.abrir(impuesto, plantilla); return c.porcentajeBloqueado; })).toEqual([true, true, false]);
      c.abrir(null, plantilla);
      expect(c.porcentajeBloqueado).toBeFalse();
    });

    it('al editar uno en uso conserva su porcentaje', () => {
      const c = crear();
      c.abrir(impuestos[1], plantilla);
      c.form.controls.nombre.setValue('IVA general');
      c.guardar();
      expect(http.expectOne(`${api}/impuesto/3`).request.body).toEqual({ nombre: 'IVA general', porcentaje: 19, activo: true });
    });

    it('valida el porcentaje de 0 a 100', () => {
      const c = crear();
      c.abrir(null, plantilla);
      for (const porcentaje of [-1, 100.5, 101, 1.234]) {
        c.form.patchValue({ nombre: 'X', porcentaje });
        expect(c.form.valid).withContext(String(porcentaje)).toBeFalse();
      }
    });
  });

  it('servicios: valida la duración, crea y muestra el código duplicado junto al campo', () => {
    const c = TestBed.createComponent(ServiciosComponent).componentInstance;
    http.expectOne(`${api}/servicio/listar`).flush([servicio]);
    http.expectOne(`${api}/especializacion/listar`).flush([{ id: 5, activo: false }, { id: 6, activo: true }]);
    expect(c.especialidadesDisponibles.map(({ id }) => id)).toEqual([6]);
    c.abrir(null, plantilla);
    c.form.patchValue({ codigo: ' VAC ', nombre: 'Vacuna', tipoServicio: 'VACUNACION', duracionMinutos: 0 });
    c.guardar();
    http.expectNone(`${api}/servicio/crear`);
    c.form.controls.duracionMinutos.setValue(20);
    c.guardar();
    const solicitud = http.expectOne(`${api}/servicio/crear`);
    expect(solicitud.request.body).toEqual({
      codigo: 'VAC', nombre: 'Vacuna', descripcion: null, tipoServicio: 'VACUNACION', especializacionId: null, duracionMinutos: 20
    });
    solicitud.flush({ message: 'x', detalles: [{ campo: 'codigo', mensaje: 'Repetido' }] }, { status: 409, statusText: 'x' });
    expect(c.form.controls.codigo.errors).toEqual({ servidor: 'Repetido' });
  });

  it('historial: filtra por fechas en el backend y por servicio en pantalla', () => {
    const c = TestBed.createComponent(HistorialTarifasComponent).componentInstance;
    const cambio = { id: 1, servicioId: 1, servicioNombre: 'Consulta', fecha: '2026-01-01T10:00:00' };
    http.expectOne(`${api}/tarifa/historial`).flush([cambio, { ...cambio, id: 2, servicioId: 2, servicioNombre: 'Baño' }]);
    expect(c.servicios.map(({ nombre }) => nombre)).toEqual(['Baño', 'Consulta']);
    c.servicioId = 2;
    c.filtrarServicio();
    expect(c.tabla.items.map(({ id }) => id)).toEqual([2]);
    c.filtrarFechas({ desde: '2026-01-01', hasta: '2026-01-31' });
    http.expectOne(`${api}/tarifa/historial?desde=2026-01-01&hasta=2026-01-31`).flush([cambio]);
    expect(c.tabla.items.map(({ id }) => id)).toEqual([1]);
  });

  it('datos de la clínica: carga y guarda sin barra final en la URL', () => {
    const c = TestBed.createComponent(ConfiguracionClinicaComponent).componentInstance;
    const datos = {
      nombre: 'Clínica', nit: '9', direccion: null, telefono: null, correo: null, prefijoFactura: 'FV', prefijoFormula: 'FM', prefijoDespacho: 'DP',
      topeDescuentoSecretaria: 10
    };
    http.expectOne(`${api}/configuracion-clinica`).flush(datos);
    c.form.controls.topeDescuentoSecretaria.setValue(101);
    c.guardar();
    http.expectNone({ method: 'PUT' });
    c.form.controls.topeDescuentoSecretaria.setValue(15);
    c.guardar();
    const solicitud = http.expectOne({ method: 'PUT', url: `${api}/configuracion-clinica` });
    expect(solicitud.request.body).toEqual({ ...datos, topeDescuentoSecretaria: 15 });
  });
});
