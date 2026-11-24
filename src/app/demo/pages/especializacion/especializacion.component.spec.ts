import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { EspecializacionComponent } from './especializacion.component';

describe('EspecializacionComponent', () => {
  let component: EspecializacionComponent;
  let fixture: ComponentFixture<EspecializacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspecializacionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspecializacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('atenúa las inactivas, filtra las activas y cambia el estado con confirmación', async () => {
    const http = TestBed.inject(HttpTestingController);
    const api = `${environment.apiUrlAuth}/especializacion`;
    http.expectOne(`${api}/listar`).flush([
      { id: 1, nombre: 'Cirugía', codigoEspecializacion: 'CIR001', activo: true },
      { id: 2, nombre: 'Dermatología', codigoEspecializacion: 'DER001', activo: false }
    ]);
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;
    const filas = () => Array.from(raiz.querySelectorAll('tbody tr'));
    expect(filas().map((fila) => fila.classList.contains('opacity-50'))).toEqual([false, true]);

    const alerta = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false, isDenied: false, isDismissed: true });
    const interruptor = raiz.querySelector<HTMLInputElement>('#activa-1')!;
    interruptor.click();
    expect(interruptor.checked).toBeTrue();
    await fixture.whenStable();
    http.expectNone(`${api}/1/estado`);

    alerta.and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
    fixture.detectChanges();
    interruptor.click();
    await fixture.whenStable();
    const cambio = http.expectOne(`${api}/1/estado`);
    expect([cambio.request.method, cambio.request.body]).toEqual(['PATCH', { activo: false }]);
    cambio.flush({});
    http.expectOne(`${api}/listar`).flush([]);

    component.listEspecializaciones = [{ id: 1, activo: true }, { id: 2, activo: false }];
    component.soloActivas = true;
    expect(component.especializacionesFiltradas.map(({ id }) => id)).toEqual([1]);
  });
});
