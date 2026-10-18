import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FormulaMedicaService } from './service/formula-medica.service';
import { FormulaMedicaComponent } from './formula-medica.component';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { HistoriaClinicaService } from '../historia-clinica/service/historia-clinica.service';

/** Pruebas del listado de fórmulas con la respuesta paginada real del backend. */
describe('FormulaMedicaComponent listado', () => {
  let fixture: ComponentFixture<FormulaMedicaComponent>;
  let component: FormulaMedicaComponent;
  let listar: jasmine.Spy;
  let crear: jasmine.Spy;

  const pagina = {
    content: [{
      formulaMedicaId: 6, mascotaId: 2, mascotaNombre: 'Luna', clienteId: 2, clienteNombre: 'María Gómez',
      nombreCliente: 'María Gómez', veterinarioId: 2, veterinarioNombre: 'María Rodríguez', fechaEmision: '2026-10-17',
      medicamento: 'Paracetamol', dosis: 4, frecuencia: '12 horas', fechaCreacion: '2026-10-17T07:30:40'
    }],
    page: 0, size: 10, totalElements: 1, totalPages: 1
  };

  beforeEach(() => {
    listar = jasmine.createSpy('listar').and.returnValue(of(pagina));
    crear = jasmine.createSpy('crear').and.returnValue(of({}));
    TestBed.configureTestingModule({
      imports: [FormulaMedicaComponent],
      providers: [
        { provide: FormulaMedicaService, useValue: { listar, crear, actualizar: jasmine.createSpy('actualizar'), consultar: jasmine.createSpy('consultar') } },
        { provide: ClienteService, useValue: { listarClientes: () => of([{ clienteId: 2, nombres: 'María', apellidos: 'Gómez' }]) } },
        { provide: MascotaService, useValue: { listarMascotas: () => of([{ mascotaId: 2, nombreMascota: 'Luna' }]) } },
        { provide: MedicoService, useValue: { listar: () => of([{ id: 2, nombres: 'María', apellidos: 'Rodríguez' }]) } },
        { provide: HistoriaClinicaService, useValue: { listar: () => of({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }) } },
      ],
    });
    fixture = TestBed.createComponent(FormulaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('solicita la primera página ordenada por fecha de registro descendente', () => {
    expect(listar).toHaveBeenCalledWith(jasmine.objectContaining({
      page: 0, size: 10, sort: 'fechaCreacionRegistro', direction: 'DESC'
    }));
    expect(component.totalElementos).toBe(1);
    expect(component.formulas[0].id).toBe(6);
  });

  it('muestra cliente, dosis y frecuencia que envía el backend en el listado', () => {
    const fila = (fixture.nativeElement as HTMLElement).querySelector('table tbody tr');
    expect(fila?.textContent).toContain('María Gómez');
    expect(fila?.textContent).toContain('4 · 12 horas');
  });

  it('en fórmulas antiguas muestra la dosis guardada como texto', () => {
    component.formulas = [{ ...pagina.content[0], id: 4, dosis: null, frecuencia: null, dosisTexto: 'Una pastilla cada 12 horas.' } as never];
    fixture.detectChanges();
    const fila = (fixture.nativeElement as HTMLElement).querySelector('table tbody tr');
    expect(fila?.textContent).toContain('Una pastilla cada 12 horas.');
    expect(fila?.textContent).not.toContain(' · ');
  });

  it('indica claramente la mascota no registrada y la ausencia de historia clínica', () => {
    component.formulas = [{ ...pagina.content[0], id: 1, mascotaId: null, mascotaNombre: null } as never];
    fixture.detectChanges();
    const celda = (fixture.nativeElement as HTMLElement).querySelector('table tbody tr')?.children[1];
    expect(celda?.textContent?.trim()).toBe('Mascota no registrada');

    component.detalle = { ...pagina.content[0], id: 1, mascotaId: null, mascotaNombre: null, historiaClinicaId: null,
      frecuencia: null, duracionDias: null, dosisTexto: 'Una pastilla', indicaciones: 'x' } as never;
    fixture.detectChanges();
    const valores = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.formula-detail-grid dd')).map((d) => d.textContent?.trim());
    expect(valores[0]).toBe('Mascota no registrada');
    expect(valores[3]).toBe('Sin historia clínica asociada');
    expect(valores[7]).toBe('No registrado');
    expect(valores[8]).toBe('No registrado');
  });

  it('envía los filtros como números y reinicia la página', () => {
    component.pagina = 3;
    component.filtroCliente = '2';
    component.filtroVeterinario = '2';
    component.filtroFecha = '2026-10-17';
    component.aplicarFiltros();
    expect(component.pagina).toBe(0);
    expect(listar).toHaveBeenCalledWith(jasmine.objectContaining({ page: 0, clienteId: 2, veterinarioId: 2, fecha: '2026-10-17' }));
  });

  it('muestra el mensaje que informa el backend cuando falla el listado', () => {
    listar.and.returnValue(throwError(() => ({ error: { message: 'Campo de ordenamiento no permitido' } })));
    component.listar();
    expect(component.cargando).toBeFalse();
    expect(component.error).toContain('Campo de ordenamiento no permitido');
  });

  it('al crear envía el contrato que espera POST /formulas-medicas', () => {
    component.abrirCrear();
    component.formulario.patchValue({
      mascotaId: 2, veterinarioId: 2, fechaEmision: '2026-10-17', medicamento: ' Paracetamol ',
      dosis: 4, frecuencia: '12 horas', duracionDias: 30, indicaciones: 'Con comida'
    });
    component.guardar();
    expect(crear).toHaveBeenCalledWith({
      mascotaId: 2, historiaClinicaId: undefined, veterinarioId: 2, fechaEmision: '2026-10-17',
      medicamento: 'Paracetamol', dosis: 4, frecuencia: '12 horas', duracionDias: 30, indicaciones: 'Con comida'
    });
  });
});
