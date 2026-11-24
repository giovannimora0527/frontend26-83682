import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { Atencion, AtencionCita } from 'src/app/models/atencion';
import { FormulaDetalle, FormulaMedica } from 'src/app/models/formula-medica';
import { crearTokenPrueba } from 'src/app/testing/jwt.testing';
import { fechaHoraIso, fechaIso } from 'src/app/shared/utils/fecha.util';
import { environment } from 'src/environments/environment';
import { AtencionDetalleComponent } from './atencion-detalle/atencion-detalle.component';
import { AtencionComponent } from './atencion.component';
import { EditorFormulaComponent } from './editor-formula/editor-formula.component';
import { FormulasCitaComponent } from './formulas-cita/formulas-cita.component';

describe('Atención médica', () => {
  const api = environment.apiUrlAuth;
  let http: HttpTestingController;
  let alerta: jasmine.Spy;
  const respuestaSwal = (isConfirmed: boolean, value?: string) => ({ isConfirmed, isDenied: false, isDismissed: !isConfirmed, value });
  const atencion: Atencion = {
    id: 7, citaId: 10, medicoId: 2, medicoNombre: 'Ana', estadoCita: 'EN_ATENCION', motivoConsulta: null, sintomas: null, diagnostico: null,
    observaciones: null, recomendaciones: null, servicios: [], fechaInicio: '2026-11-24T09:00:00', fechaFin: null, finalizada: false
  };
  const datos: AtencionCita = {
    atencion, cita: { id: 10, fechaInicio: '2026-11-24T09:00:00', fechaFin: '2026-11-24T09:30:00', estado: 'EN_ATENCION', motivo: 'Vómito', servicioId: 1, servicioNombre: 'Consulta' },
    mascota: { id: 1, nombre: 'Firulais', especie: 'Perro', raza: 'Criollo', edad: 3, activo: true },
    propietario: { id: 4, nombre: 'Juan', documento: '1', telefono: null, correo: null }, antecedentes: { atenciones: [], anotaciones: [], formulas: [] }
  };
  const servicios = [
    { id: 1, nombre: 'Consulta', activo: true, tarifaVigente: { id: 1, valor: 50000, impuestoId: 1, porcentajeIva: 19 } },
    { id: 2, nombre: 'Curación', activo: true, tarifaVigente: null }
  ];
  const detalle: FormulaDetalle = {
    id: 1, medicamentoId: 5, medicamentoCodigo: 'AMX00500', medicamentoNombre: 'Amoxicilina', presentacion: null, dosis: 1, unidadDosis: 'tableta',
    frecuenciaHoras: 8, duracionDias: 7, viaAdministracion: 'ORAL', cantidadSugerida: 21, cantidadPrescrita: 21, cantidadDespachada: 0, indicaciones: null,
    cantidadDisponibleVigente: 100, alcanza: true
  };
  const formula = { id: 3, numero: null, citaId: 10, estadoFormula: 'BORRADOR', estadoDespacho: null, detalles: [detalle] } as unknown as FormulaMedica;

  beforeEach(() => {
    alerta = spyOn(Swal, 'fire').and.resolveTo(respuestaSwal(true, ' Error '));
    sessionStorage.setItem('token', crearTokenPrueba({ rol: 'MEDICO', medicoId: 2 }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ citaId: '10' })) } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => sessionStorage.removeItem('token'));

  it('lista las citas de hoy separando pendientes y atendidas, sin canceladas', () => {
    const c = TestBed.createComponent(AtencionComponent).componentInstance;
    const hoy = fechaIso(new Date());
    http.expectOne(`${api}/cita/calendario?desde=${hoy}&hasta=${hoy}`).flush([
      { id: 2, start: 'b', estado: 'EN_ATENCION' }, { id: 1, start: 'a', estado: 'PROGRAMADA' }, { id: 3, start: 'c', estado: 'CANCELADA' },
      { id: 4, start: 'd', estado: 'ATENDIDA' }
    ]);
    expect(c.pendientes.map(({ id }) => id)).toEqual([1, 2]);
    expect(c.atendidas.map(({ id }) => id)).toEqual([4]);
  });

  describe('detalle', () => {
    function abrir(respuesta: AtencionCita = datos, formulas: FormulaMedica[] = []) {
      const fixture = TestBed.createComponent(AtencionDetalleComponent);
      http.expectOne(`${api}/servicio/listar?soloActivos=true`).flush(servicios);
      http.expectOne(`${api}/atencion/iniciar/10`).flush({});
      http.expectOne(`${api}/atencion/cita/10`).flush(respuesta);
      fixture.detectChanges();
      http.match(`${api}/formula-medica/cita/10`).forEach((solicitud) => solicitud.flush(formulas));
      fixture.detectChanges();
      return fixture;
    }
    const completa = { motivoConsulta: 'Vómito', sintomas: 'Decaimiento', diagnostico: 'Gastritis' };
    const guardado = () => http.expectOne({ method: 'PUT', url: `${api}/atencion/7` });

    it('inicia, propone el motivo y el servicio agendado', () => {
      const c = abrir().componentInstance;
      expect(c.form.controls.motivoConsulta.value).toBe('Vómito');
      expect(c.servicios.getRawValue()).toEqual([{ servicioId: 1, cantidad: 1 }]);
      expect(c.subtotal).toBe(59500);
      expect(c.serviciosDisponibles.map(({ id }) => id)).toEqual([2]);
    });

    it('ante un 409 al iniciar muestra el mensaje y vuelve al calendario', () => {
      const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      TestBed.createComponent(AtencionDetalleComponent);
      http.expectOne(`${api}/atencion/iniciar/10`).flush({ message: 'La atención solo se inicia el día de la cita.' }, { status: 409, statusText: 'x' });
      expect(alerta.calls.mostRecent().args[1]).toContain('el día de la cita');
      expect(navegar).toHaveBeenCalledOnceWith(['/inicio/calendario']);
    });

    it('el borrador admite textos vacíos y no pierde lo escrito mientras se guarda', () => {
      const c = abrir().componentInstance;
      c.form.controls.sintomas.setValue('Decaimiento');
      c.form.markAsDirty();
      c.guardarBorrador();
      c.guardarBorrador();
      const solicitud = guardado();
      expect(solicitud.request.body).toEqual({
        motivoConsulta: 'Vómito', sintomas: 'Decaimiento', diagnostico: null, observaciones: null, recomendaciones: null, servicios: [{ servicioId: 1, cantidad: 1 }]
      });
      c.form.controls.diagnostico.setValue('Gastritis');
      solicitud.flush({ status: 200, message: 'ok' });
      expect(c.form.dirty).toBeTrue();
      // El segundo guardado quedó en cola y sale solo, con lo escrito mientras tanto.
      const segunda = guardado();
      expect(segunda.request.body.diagnostico).toBe('Gastritis');
      segunda.flush({ status: 200, message: 'ok' });
      expect(c.form.dirty).toBeFalse();
    });

    it('autoguarda a los 60 segundos solo si hubo cambios', fakeAsync(() => {
      const c = abrir({ ...datos, atencion: { ...atencion, servicios: [{ servicioId: 1, cantidad: 1, servicioCodigo: 'C', servicioNombre: 'Consulta' }] } }).componentInstance;
      tick(60_000);
      http.expectNone({ method: 'PUT', url: `${api}/atencion/7` });
      c.form.controls.sintomas.setValue('x');
      c.form.markAsDirty();
      tick(60_000);
      guardado().flush({ status: 200, message: 'ok' });
      tick(60_000);
      http.expectNone({ method: 'PUT', url: `${api}/atencion/7` });
      discardPeriodicTasks();
    }));

    for (const [caso, preparar, pestana] of [
      ['campos obligatorios', (c: AtencionDetalleComponent) => c.form.controls.diagnostico.setValue(' '), 'consulta'],
      ['al menos un servicio', (c: AtencionDetalleComponent) => c.quitarServicio(0), 'servicios'],
      ['cantidades válidas', (c: AtencionDetalleComponent) => c.servicios.at(0).controls.cantidad.setValue(0), 'servicios']
    ] as const) {
      it(`finalizar exige ${caso}`, async () => {
        const c = abrir().componentInstance;
        c.form.patchValue(completa);
        preparar(c);
        await c.finalizar();
        expect(alerta).not.toHaveBeenCalled();
        expect(c.pestana).toBe(pestana);
      });
    }

    it('finalizar exige que no haya fórmulas en borrador', async () => {
      const fixture = abrir(datos, [formula]);
      fixture.componentInstance.form.patchValue(completa);
      await fixture.componentInstance.finalizar();
      expect(fixture.componentInstance.respuestaError).toContain('borrador');
      expect(alerta).not.toHaveBeenCalled();
    });

    it('guarda lo pendiente, finaliza y queda en solo lectura', async () => {
      const c = abrir().componentInstance;
      c.form.patchValue(completa);
      c.form.markAsDirty();
      await c.finalizar();
      guardado().flush({ status: 200, message: 'ok' });
      http.expectOne(`${api}/atencion/7/finalizar`).flush({ status: 200, message: 'Finalizada' });
      http.expectOne(`${api}/atencion/cita/10`).flush({
        ...datos, atencion: { ...atencion, ...completa, finalizada: true, estadoCita: 'ATENDIDA', fechaFin: fechaHoraIso(new Date()) }
      });
      expect([c.editable, c.form.disabled, c.puedeFormular, c.finalizando]).toEqual([false, true, true, false]);
    });

    it('si falla el guardado no finaliza', async () => {
      const c = abrir().componentInstance;
      c.form.patchValue(completa);
      c.form.markAsDirty();
      await c.finalizar();
      guardado().flush({ message: 'Servicio inactivo' }, { status: 409, statusText: 'x' });
      http.expectNone(`${api}/atencion/7/finalizar`);
      expect(c.respuestaError).toBe('Servicio inactivo');
      expect(c.finalizando).toBeFalse();
    });

    it('muestra con claridad el 409 por servicio sin tarifa', async () => {
      const c = abrir().componentInstance;
      c.form.patchValue(completa);
      c.form.markAsPristine();
      await c.finalizar();
      http.expectOne(`${api}/atencion/7/finalizar`).flush({ message: 'El servicio Curación no tiene tarifa vigente.' }, { status: 409, statusText: 'x' });
      expect(alerta.calls.mostRecent().args[1]).toContain('no tiene tarifa vigente');
    });

    it('una atención de otro día no permite formular', () => {
      const c = abrir({ ...datos, atencion: { ...atencion, finalizada: true, fechaFin: '2020-01-01T10:00:00' } }).componentInstance;
      expect(c.puedeFormular).toBeFalse();
    });

    it('pregunta antes de salir con cambios, salvo que la sesión haya terminado', async () => {
      alerta.and.resolveTo(respuestaSwal(false));
      const c = abrir().componentInstance;
      c.form.markAsDirty();
      expect(await c.puedeSalir()).toBeFalse();
      sessionStorage.removeItem('token');
      expect(await c.puedeSalir()).toBeTrue();
    });
  });

  describe('editor de fórmula', () => {
    function crear(borrador: FormulaMedica | null = null) {
      const fixture = TestBed.createComponent(EditorFormulaComponent);
      fixture.componentRef.setInput('citaId', 10);
      fixture.componentRef.setInput('formula', borrador);
      fixture.detectChanges();
      http.expectOne(`${api}/inventario/productos`).flush([
        { id: 5, codigo: 'AMX00500', nombre: 'Amoxicilina', activo: true, tipoProducto: 'MEDICAMENTO' },
        { id: 6, codigo: 'GAS00010', nombre: 'Gasa', activo: true, tipoProducto: 'INSUMO' }, { id: 7, codigo: 'X', nombre: 'Viejo', activo: false, tipoProducto: 'MEDICAMENTO' }
      ]);
      return fixture.componentInstance;
    }
    const disponible = (id: number, cantidad: number) =>
      http.expectOne(`${api}/inventario/disponibilidad/${id}`).flush({ medicamentoId: id, cantidadDisponibleVigente: cantidad, cantidadVencida: 0, lotesVigentes: [] });

    function llenar(c: EditorFormulaComponent) {
      c.detalles.at(0).patchValue({
        medicamento: c.medicamentos[0], dosis: 1, unidadDosis: ' tableta ', frecuenciaOpcion: '8', duracionDias: 7, viaAdministracion: 'ORAL'
      });
    }

    it('solo ofrece medicamentos activos', () => {
      expect(crear().medicamentos.map(({ id }) => id)).toEqual([5]);
    });

    it('calcula la cantidad en vivo (1 tableta cada 8 h por 7 días = 21) y respeta el ajuste del médico', () => {
      const c = crear();
      llenar(c);
      const renglon = c.detalles.at(0);
      expect(renglon.controls.cantidadPrescrita.value).toBe(21);
      renglon.controls.duracionDias.setValue(10);
      expect(renglon.controls.cantidadPrescrita.value).toBe(30);
      renglon.controls.cantidadPrescrita.setValue(25);
      renglon.controls.duracionDias.setValue(5);
      expect(renglon.controls.cantidadPrescrita.value).toBe(25);
      c.usarSugerida(0);
      expect(renglon.controls.cantidadPrescrita.value).toBe(15);
      renglon.controls.duracionDias.setValue(7);
      expect(renglon.controls.cantidadPrescrita.value).toBe(21);
    });

    it('la frecuencia personalizada va de 1 a 168 horas', () => {
      const c = crear();
      llenar(c);
      c.detalles.at(0).controls.frecuenciaOpcion.setValue('otra');
      expect(c.form.valid).toBeFalse();
      for (const [horas, valido] of [[0, false], [169, false], [1.5, false], [48, true]] as const) {
        c.detalles.at(0).controls.frecuenciaHoras.setValue(horas);
        expect(c.detalles.at(0).controls.frecuenciaHoras.valid).withContext(String(horas)).toBe(valido);
      }
    });

    it('avisa sin bloquear cuando no alcanza la disponibilidad', () => {
      const c = crear();
      llenar(c);
      disponible(5, 10);
      expect(c.noAlcanza(0)).toBeTrue();
      expect(c.colorDisponible(0)).toContain('bg-warning');
      c.guardar();
      const solicitud: TestRequest = http.expectOne(`${api}/formula-medica/crear`);
      expect(solicitud.request.body).toEqual({
        citaId: 10, indicacionesGenerales: null, detalles: [{
          medicamentoId: 5, dosis: 1, unidadDosis: 'tableta', frecuenciaHoras: 8, duracionDias: 7, viaAdministracion: 'ORAL', cantidadPrescrita: 21, indicaciones: null
        }]
      });
    });

    it('no permite repetir un medicamento', () => {
      const c = crear();
      llenar(c);
      c.agregar();
      c.detalles.at(1).patchValue({ ...c.detalles.at(0).getRawValue() });
      c.guardar();
      http.expectNone(`${api}/formula-medica/crear`);
      expect(c.respuestaError).toContain('No repitas');
    });

    it('edita un borrador con PUT conservando la cantidad ajustada', () => {
      const c = crear({ ...formula, detalles: [{ ...detalle, frecuenciaHoras: 48, cantidadSugerida: 4, cantidadPrescrita: 6 }] });
      disponible(5, 100);
      expect(c.detalles.at(0).getRawValue()).toEqual(jasmine.objectContaining({ frecuenciaOpcion: 'otra', frecuenciaHoras: 48, cantidadPrescrita: 6 }));
      expect(c.form.dirty).toBeFalse();
      c.guardar();
      expect(http.expectOne(`${api}/formula-medica/3`).request.method).toBe('PUT');
    });
  });

  describe('fórmulas de la cita', () => {
    function crear(formulas: FormulaMedica[], puedeFormular = true) {
      const fixture = TestBed.createComponent(FormulasCitaComponent);
      fixture.componentRef.setInput('citaId', 10);
      fixture.componentRef.setInput('puedeFormular', puedeFormular);
      fixture.detectChanges();
      http.expectOne(`${api}/formula-medica/cita/10`).flush(formulas);
      fixture.detectChanges();
      return fixture;
    }
    const botones = (raiz: HTMLElement) => Array.from(raiz.querySelectorAll('button')).map((b) => b.textContent?.trim());

    it('ofrece las acciones según el estado y lo entregado', () => {
      const confirmada = { ...formula, id: 4, numero: 'FM-1', estadoFormula: 'CONFIRMADA' } as FormulaMedica;
      const entregada = { ...confirmada, id: 5, detalles: [{ ...detalle, cantidadDespachada: 1 }] };
      expect(botones(crear([formula]).nativeElement)).toEqual(['Editar', 'Confirmar fórmula', 'Anular', 'Nueva fórmula']);
      expect(botones(crear([confirmada]).nativeElement)).toEqual(['Anular', 'Ver PDF', 'PDF', 'Nueva fórmula']);
      expect(botones(crear([entregada], false).nativeElement)).toEqual(['Ver PDF', 'PDF']);
    });

    it('confirma y anula con motivo', async () => {
      const c = crear([formula]).componentInstance;
      await c.confirmar(formula);
      http.expectOne(`${api}/formula-medica/3/confirmar`).flush({ status: 200, message: 'ok' });
      http.expectOne(`${api}/formula-medica/cita/10`).flush([formula]);
      await c.anular(formula);
      expect(http.expectOne(`${api}/formula-medica/3/anular`).request.body).toEqual({ motivo: 'Error' });
    });

    it('no confirma si se cancela', async () => {
      alerta.and.resolveTo(respuestaSwal(false));
      const c = crear([formula]).componentInstance;
      await c.confirmar(formula);
      http.expectNone(`${api}/formula-medica/3/confirmar`);
      expect(c.procesando()).toBeFalse();
    });
  });
});
