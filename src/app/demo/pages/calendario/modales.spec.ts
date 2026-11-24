import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { EstadoCita } from 'src/app/models/estados';
import { EventoCalendario } from 'src/app/models/evento-calendario';
import { crearTokenPrueba } from 'src/app/testing/jwt.testing';
import { HistorialCitaComponent } from '../cita/historial-cita/historial-cita.component';
import { DetalleCitaComponent } from './detalle-cita/detalle-cita.component';
import { NuevaCitaComponent } from './nueva-cita/nueva-cita.component';

const evento: EventoCalendario = {
  id: 10, title: 'Firulais - Juan Pérez', start: '2099-11-24T09:00:00', end: '2099-11-24T09:30:00', estado: 'CONFIRMADA', color: '#0d6efd',
  extendedProps: {
    motivo: 'Control general', mascotaId: 1, mascotaNombre: 'Firulais', especie: 'Perro', raza: 'Criollo', edad: 3, clienteId: 4,
    clienteNombre: 'Juan Pérez', clienteTelefono: '300', clienteDocumento: '123', medicoId: 2, medicoNombre: 'Ana', servicioId: 1,
    servicioNombre: 'Consulta', motivoCancelacion: null
  }
};

describe('Modales del calendario', () => {
  const api = environment.apiUrlAuth;
  let http: HttpTestingController;
  let modal: jasmine.SpyObj<NgbActiveModal>;
  let alerta: jasmine.Spy;

  beforeEach(() => {
    modal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    alerta = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false, value: ' Viaje ' });
    sessionStorage.setItem('token', crearTokenPrueba({ rol: 'MEDICO', medicoId: 2 }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: NgbActiveModal, useValue: modal }]
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => sessionStorage.removeItem('token'));

  describe('detalle', () => {
    function crear(estado: EstadoCita = 'PROGRAMADA') {
      const fixture = TestBed.createComponent(DetalleCitaComponent);
      fixture.componentInstance.evento = { ...evento, estado };
      fixture.detectChanges();
      return fixture;
    }

    for (const [estado, esperados] of [
      ['PROGRAMADA', ['Confirmar', 'Reprogramar', 'Cancelar cita', 'Iniciar atención']],
      ['CONFIRMADA', ['Reprogramar', 'Cancelar cita', 'Iniciar atención']],
      ['EN_ATENCION', ['Continuar atención']], ['ATENDIDA', ['Ver atención']], ['CANCELADA', []]
    ] as [EstadoCita, string[]][]) {
      it(`ofrece las acciones de ${estado}`, () => {
        const raiz: HTMLElement = crear(estado).nativeElement;
        const botones = Array.from(raiz.querySelectorAll('.modal-footer button')).map((b) => b.textContent?.trim());
        expect(botones).toEqual(['Historial de la mascota', 'Historial de estados', ...esperados]);
      });
    }

    it('confirma por PATCH y avisa del cambio', () => {
      crear().componentInstance.confirmar();
      const solicitud = http.expectOne(`${api}/cita/10/estado`);
      expect([solicitud.request.method, solicitud.request.body]).toEqual(['PATCH', { estado: 'CONFIRMADA' }]);
      solicitud.flush({ status: 200, message: 'ok' });
      expect(modal.close).toHaveBeenCalledOnceWith(true);
    });

    it('cancela con el motivo y muestra el error del backend', async () => {
      const { componentInstance: c } = crear();
      await c.cancelar();
      const solicitud = http.expectOne(`${api}/cita/10/estado`);
      expect(solicitud.request.body).toEqual({ estado: 'CANCELADA', motivo: 'Viaje' });
      solicitud.flush({ message: 'No se puede' }, { status: 409, statusText: 'x' });
      expect(c.error).toBe('No se puede');
      expect(modal.close).not.toHaveBeenCalled();
      const validar = alerta.calls.first().args[0].inputValidator;
      expect(validar('  ')).toContain('motivo');
    });

    it('no reprograma al pasado', async () => {
      const { componentInstance: c } = crear();
      c.nuevaFecha = '2020-01-01T09:00';
      await c.reprogramar();
      http.expectNone(`${api}/cita/10/reprogramar`);
      expect(c.error).toContain('futuras');
      c.nuevaFecha = '2099-01-01T09:00';
      await c.reprogramar();
      expect(http.expectOne(`${api}/cita/10/reprogramar`).request.body).toEqual({ fechaInicio: '2099-01-01T09:00:00' });
    });

    it('iniciar atención navega sin cambiar el estado', () => {
      const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      crear().componentInstance.irAtencion();
      expect(navegar).toHaveBeenCalledOnceWith(['/inicio/atencion', 10]);
      http.expectNone(`${api}/cita/10/estado`);
    });

    it('una cita atendida ofrece la prefactura y las fórmulas confirmadas', () => {
      const fixture = crear('ATENDIDA');
      http.expectOne(`${api}/atencion/cita/10`).flush({ atencion: { id: 7 } });
      http.expectOne(`${api}/formula-medica/cita/10`).flush([
        { id: 1, numero: 'FM-1', estadoFormula: 'CONFIRMADA' }, { id: 2, numero: null, estadoFormula: 'BORRADOR' }
      ]);
      fixture.detectChanges();
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Prefactura');
      expect(texto).toContain('Fórmula FM-1');
      expect(fixture.componentInstance.formulas.length).toBe(1);
    });
  });

  describe('nueva cita', () => {
    function crear() {
      const fixture = TestBed.createComponent(NuevaCitaComponent);
      fixture.componentInstance.inicio = new Date(2099, 10, 24, 9, 0);
      fixture.detectChanges();
      http.expectOne(`${api}/cliente/listar`).flush([
        { id: 4, nombres: 'José', apellidos: 'Pérez', numeroDocumento: '123', activo: true }, { id: 5, nombres: 'Ana', apellidos: 'Paz', numeroDocumento: '9' }
      ]);
      http.expectOne(`${api}/servicio/listar?soloActivos=true`).flush([{ id: 1, nombre: 'Consulta', duracionMinutos: 45 }]);
      return fixture.componentInstance;
    }

    function llenar() {
      const c = crear();
      c.form.controls.clienteId.setValue(4);
      http.expectOne(`${api}/mascota/buscar-by-cliente?clienteId=4`).flush([{ mascotaId: 1, activo: true }, { mascotaId: 2, activo: false }]);
      c.form.patchValue({ mascotaId: 1, servicioId: 1, motivo: ' Control general ' });
      return c;
    }

    it('filtra clientes sin tildes y solo ofrece mascotas activas del cliente', () => {
      const c = llenar();
      expect(c.mascotas.map(({ mascotaId }) => mascotaId)).toEqual([1]);
      c.form.controls.clienteId.setValue(null);
      expect(c.form.controls.mascotaId.value).toBeNull();
      c.terminoCliente = 'jose';
      expect(c.clientesFiltrados.map(({ id }) => id)).toEqual([4]);
    });

    it('calcula el fin con la duración del servicio y crea para el médico autenticado', () => {
      const c = llenar();
      expect(c.fin).toEqual(new Date(2099, 10, 24, 9, 45));
      c.guardar();
      c.guardar();
      const solicitud = http.expectOne(`${api}/cita/crear`);
      expect(solicitud.request.body).toEqual({
        mascotaId: 1, medicoId: 2, clienteId: 4, servicioId: 1, fechaInicio: '2099-11-24T09:00:00', motivo: 'Control general'
      });
      solicitud.flush({ status: 200, message: 'ok' });
      expect(modal.close).toHaveBeenCalledOnceWith(true);
    });

    it('muestra el choque de agenda junto a la fecha', () => {
      const c = llenar();
      c.guardar();
      http.expectOne(`${api}/cita/crear`).flush(
        { message: 'x', detalles: [{ campo: 'fechaInicio', mensaje: 'El médico ya tiene una cita' }] }, { status: 409, statusText: 'x' });
      expect(c.form.controls.fechaInicio.errors).toEqual({ servidor: 'El médico ya tiene una cita' });
    });

    it('valida el motivo y la fecha futura', () => {
      const c = llenar();
      for (const cambio of [{ motivo: 'corto' }, { motivo: '      ' }, { motivo: 'Control general', fechaInicio: '2020-01-01T09:00' }]) {
        c.form.patchValue(cambio);
        c.guardar();
      }
      http.expectNone(`${api}/cita/crear`);
    });

    it('avisa si el usuario no está vinculado a un médico', () => {
      sessionStorage.setItem('token', crearTokenPrueba({ rol: 'MEDICO', medicoId: null }));
      expect(crear().respuestaError).toContain('no está vinculado');
    });
  });

  it('el historial muestra canceladas con su motivo y las reprogramaciones', () => {
    let fixture = TestBed.createComponent(HistorialCitaComponent);
    fixture.componentInstance.mascotaId = 1;
    fixture.detectChanges();
    http.expectOne(`${api}/cita/historial-mascota/1`).flush([
      { id: 1, fechaInicio: '2026-01-01T09:00:00', estado: 'CANCELADA', motivo: 'Control', motivoCancelacion: 'Lluvia' }
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cancelada: Lluvia');

    fixture = TestBed.createComponent(HistorialCitaComponent);
    fixture.componentInstance.citaId = 10;
    fixture.detectChanges();
    http.expectOne(`${api}/cita/10/historial-estados`).flush([
      { id: 1, estadoAnterior: null, estadoNuevo: 'PROGRAMADA', fechaInicioAnterior: null, fechaInicioNueva: '2026-01-01T09:00:00', motivo: null, usuario: 'a', fecha: '2026-01-01T08:00:00' },
      { id: 2, estadoAnterior: 'PROGRAMADA', estadoNuevo: 'PROGRAMADA', fechaInicioAnterior: '2026-01-01T09:00:00', fechaInicioNueva: '2026-01-02T09:00:00', motivo: null, usuario: 'a', fecha: '2026-01-01T08:00:00' }
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Creación');
    expect(fixture.nativeElement.textContent).toContain('01/01/2026 09:00 → 02/01/2026 09:00');
  });

  it('el historial muestra el error', () => {
    const fixture = TestBed.createComponent(HistorialCitaComponent);
    fixture.componentInstance.citaId = 10;
    fixture.detectChanges();
    http.expectOne(`${api}/cita/10/historial-estados`).flush(null, { status: 404, statusText: 'x' });
    expect(fixture.componentInstance.error).toContain('No fue posible');
  });
});
