import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AnotacionesComponent } from './anotaciones.component';

const API = 'http://localhost:8080/clinica/v1';

describe('AnotacionesComponent presentación', () => {
  let fixture: ComponentFixture<AnotacionesComponent>;
  let component: AnotacionesComponent;
  let http: HttpTestingController;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnotacionesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AnotacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${API}/historias-clinicas`).flush({
      content: [{ historiaClinicaId: 1, mascotaId: 11, mascotaNombre: 'Thor', motivoConsulta: 'medica', fechaHora: '2026-10-16T20:36:00', veterinarioId: 2 }],
      page: 0, size: 100, totalElements: 1, totalPages: 1
    });
    http.expectOne(`${API}/veterinarios`).flush([{ veterinarioId: 2, nombres: 'María', apellidos: 'Rodríguez' }]);
    http.expectOne((r) => r.url === `${API}/anotaciones`).flush({
      content: [
        { anotacionId: 3, historiaClinicaId: 1, veterinarioId: 2, fechaHora: '2026-10-17T09:06:00', descripcion: 'bien', observacion: null, diagnosticoEvolucion: null },
        { anotacionId: 9, historiaClinicaId: 1, veterinarioId: 2, fechaHora: '2026-10-18T21:47:00', descripcion: 'Control', observacion: 'Come bien', diagnosticoEvolucion: 'Mejora' }
      ],
      page: 0, size: 10, totalElements: 2, totalPages: 1
    });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('muestra la historia con mascota, motivo y fecha legible en lugar de la fecha técnica', () => {
    const filas = Array.from(el().querySelectorAll<HTMLTableRowElement>('table tbody tr'));
    expect(filas[0].cells[1].textContent?.trim()).toBe('Thor · medica (16/10/2026)');
    expect(el().textContent).not.toContain('2026-10-16T20:36:00');
    expect(filas[0].cells[4].textContent?.trim()).toBe('—');
    expect(filas[1].cells[4].textContent?.trim()).toBe('Mejora');
    const opcionFiltro = Array.from(el().querySelectorAll('select option')).map((o) => o.textContent?.trim());
    expect(opcionFiltro).toContain('Thor · medica (16/10/2026)');
  });

  it('el detalle muestra "No registrado" en registros antiguos y los valores reales cuando existen', () => {
    component.verDetalle(component.anotaciones[0]);
    http.expectOne(`${API}/anotaciones/3`).flush({ anotacionId: 3, historiaClinicaId: 1, veterinarioId: 2, fechaHora: '2026-10-17T09:06:00',
      descripcion: 'bien', observacion: null, diagnosticoEvolucion: '  ' });
    fixture.detectChanges();
    let detalle = Array.from(el().querySelectorAll('.formula-detail-grid dd')).map((d) => d.textContent?.trim());
    expect(detalle[0]).toBe('Thor · medica (16/10/2026)');
    expect(detalle[4]).toBe('No registrado');
    expect(detalle[5]).toBe('No registrado');

    component.verDetalle(component.anotaciones[1]);
    http.expectOne(`${API}/anotaciones/9`).flush({ anotacionId: 9, historiaClinicaId: 1, veterinarioId: 2, fechaHora: '2026-10-18T21:47:00',
      descripcion: 'Control', observacion: 'Come bien', diagnosticoEvolucion: 'Mejora' });
    fixture.detectChanges();
    detalle = Array.from(el().querySelectorAll('.formula-detail-grid dd')).map((d) => d.textContent?.trim());
    expect(detalle[4]).toBe('Come bien');
    expect(detalle[5]).toBe('Mejora');
  });

  it('una historia que no está en la lista se identifica por su número', () => {
    expect(component.nombreHistoria(99)).toBe('Historia clínica N.º 99');
  });
});
