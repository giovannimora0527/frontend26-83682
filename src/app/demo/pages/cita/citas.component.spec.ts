import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CitasComponent } from './citas.component';

const API = 'http://localhost:8080/clinica/v1';

describe('CitasComponent editar', () => {
  let fixture: ComponentFixture<CitasComponent>;
  let component: CitasComponent;
  let http: HttpTestingController;

  const cita = (citaId: number, estado: string) => ({
    citaId, clienteId: 2, clienteNombre: 'María Gómez', mascotaId: 2, mascotaNombre: 'Luna', veterinarioId: 2,
    veterinarioNombre: 'María Rodríguez', fecha: '2026-10-17', hora: '11:30:00', motivoConsulta: 'consultar', estado
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(`${API}/cliente/listar`).flush([{ clienteId: 1, nombres: 'Juan', apellidos: 'Pérez' }, { clienteId: 2, nombres: 'María', apellidos: 'Gómez' }]);
    http.expectOne(`${API}/veterinarios`).flush([{ veterinarioId: 2, nombres: 'María', apellidos: 'Rodríguez' }, { veterinarioId: 3, nombres: 'Carlos', apellidos: 'Martínez' }]);
    http.expectOne((r) => r.url === `${API}/citas`).flush({
      content: [cita(4, 'PENDIENTE'), cita(5, 'PROGRAMADA'), cita(6, 'ATENDIDA')], page: 0, size: 10, totalElements: 3, totalPages: 1
    });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const botonesEditar = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('table tbody tr'))
    .map((tr) => Array.from(tr.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Editar') as HTMLButtonElement);
  const seleccionado = (id: string) => (fixture.nativeElement.querySelector(`#${id}`) as HTMLSelectElement).selectedOptions[0]?.textContent?.trim();

  it('habilita Editar en citas pendientes, confirmadas o programadas y lo bloquea en atendidas', () => {
    expect(botonesEditar().map((b) => b.disabled)).toEqual([false, false, true]);
  });

  it('cita pendiente: carga sus datos con cliente, mascota y veterinario seleccionados y guarda con PUT /citas/{id}', () => {
    botonesEditar()[0].click();
    http.expectOne(`${API}/cliente/2/mascotas`).flush([{ mascotaId: 1, nombreMascota: 'Rocky', clienteId: 2 }, { mascotaId: 2, nombreMascota: 'Luna', clienteId: 2 }]);
    fixture.detectChanges();

    expect(seleccionado('cita-cliente')).toBe('María Gómez');
    expect(seleccionado('cita-mascota')).toBe('Luna');
    expect(seleccionado('cita-vet')).toBe('María Rodríguez');
    expect((fixture.nativeElement.querySelector('#cita-fecha') as HTMLInputElement).value).toBe('2026-10-17');
    expect((fixture.nativeElement.querySelector('#cita-hora') as HTMLInputElement).value).toBe('11:30');
    expect(component.formulario.controls['motivoConsulta'].enabled).toBeTrue();

    component.formulario.patchValue({ motivoConsulta: 'consultar control', veterinarioId: 3 });
    component.guardar();
    const put = http.expectOne((r) => r.method === 'PUT');
    expect(put.request.url).toBe(`${API}/citas/4`);
    expect(put.request.body).toEqual({ clienteId: 2, mascotaId: 2, veterinarioId: 3, fecha: '2026-10-17', hora: '11:30:00',
      motivoConsulta: 'consultar control', estado: 'PENDIENTE' });
    put.flush(cita(4, 'PENDIENTE'));
    http.expectOne((r) => r.url === `${API}/citas`).flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
    expect(component.modalAbierto).toBeFalse();
    expect(component.exito).toContain('actualizada');
  });

  it('cita programada: se puede reprogramar (veterinario, fecha, hora) y ofrece las transiciones válidas', () => {
    botonesEditar()[1].click();
    http.expectOne(`${API}/cliente/2/mascotas`).flush([{ mascotaId: 2, nombreMascota: 'Luna', clienteId: 2 }]);
    fixture.detectChanges();

    for (const campo of ['clienteId', 'mascotaId', 'veterinarioId', 'fecha', 'hora', 'motivoConsulta'])
      expect(component.formulario.controls[campo].enabled).withContext(campo).toBeTrue();
    expect(fixture.nativeElement.querySelector('.clinic-dialog .alert-info')).toBeNull();
    expect(component.estadosFormulario).toEqual(['PROGRAMADA', 'ATENDIDA', 'CANCELADA']);
    expect(seleccionado('cita-mascota')).toBe('Luna');

    component.formulario.patchValue({ veterinarioId: 3, fecha: '2026-12-01', hora: '09:15' });
    component.guardar();
    const put = http.expectOne((r) => r.method === 'PUT');
    expect(put.request.url).toBe(`${API}/citas/5`);
    expect(put.request.body).toEqual({ clienteId: 2, mascotaId: 2, veterinarioId: 3, fecha: '2026-12-01', hora: '09:15:00',
      motivoConsulta: 'consultar', estado: 'PROGRAMADA' });
    put.flush(cita(5, 'PROGRAMADA'));
    http.expectOne((r) => r.url === `${API}/citas`).flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('nueva cita después de editar: campos habilitados y mascota bloqueada hasta elegir cliente', () => {
    botonesEditar()[1].click();
    http.expectOne(`${API}/cliente/2/mascotas`).flush([{ mascotaId: 2, nombreMascota: 'Luna', clienteId: 2 }]);
    component.cerrarModal();
    component.abrirCrear();
    expect(component.formulario.controls['clienteId'].enabled).toBeTrue();
    expect(component.formulario.controls['motivoConsulta'].enabled).toBeTrue();
    expect(component.formulario.controls['mascotaId'].disabled).toBeTrue();
    expect(component.estadosFormulario).toEqual(['PENDIENTE', 'CONFIRMADA', 'PROGRAMADA']);
  });
});
