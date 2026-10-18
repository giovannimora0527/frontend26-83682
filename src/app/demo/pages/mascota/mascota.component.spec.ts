import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { MascotaComponent } from './mascota.component';
import { MascotaService } from './service/mascota.service';
import { RazaService } from './service/raza.service';
import { ClienteService } from '../cliente/service/cliente.service';

describe('MascotaComponent', () => {
  let component: MascotaComponent;
  let fixture: ComponentFixture<MascotaComponent>;
  let mascotaService: jasmine.SpyObj<MascotaService>;
  let swalFire: jasmine.Spy;

  beforeEach(async () => {
    mascotaService = jasmine.createSpyObj<MascotaService>('MascotaService', [
      'listarMascotas', 'crearMascota', 'actualizarMascota', 'eliminarMascota'
    ]);
    mascotaService.listarMascotas.and.returnValue(of([]));
    mascotaService.crearMascota.and.returnValue(of({}));
    mascotaService.actualizarMascota.and.returnValue(of({}));
    mascotaService.eliminarMascota.and.returnValue(of({ status: 200, message: 'Mascota eliminada correctamente' }));

    await TestBed.configureTestingModule({
      imports: [MascotaComponent],
      providers: [
        { provide: MascotaService, useValue: mascotaService },
        { provide: RazaService, useValue: { listarRazas: () => of([]) } },
        { provide: ClienteService, useValue: { listarClientes: () => of([]) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MascotaComponent);
    component = fixture.componentInstance;
    swalFire = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as never);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the backend when deletion is cancelled', async () => {
    swalFire.and.resolveTo({ isConfirmed: false } as never);

    await component.eliminarMascota({ mascotaId: 8, nombreMascota: 'Luna' });

    expect(mascotaService.eliminarMascota).not.toHaveBeenCalled();
  });

  it('removes the confirmed mascota from the current list after backend success', async () => {
    const mascota = { mascotaId: 8, nombreMascota: 'Luna' };
    component.listMascotas = [mascota, { mascotaId: 9, nombreMascota: 'Max' }];

    await component.eliminarMascota(mascota);

    expect(mascotaService.eliminarMascota).toHaveBeenCalledOnceWith(8);
    expect(component.listMascotas.map((item) => item.mascotaId)).toEqual([9]);
  });

  it('keeps the list unchanged and shows the backend message when deletion fails', async () => {
    const mascota = { mascotaId: 8, nombreMascota: 'Luna' };
    component.listMascotas = [mascota];
    mascotaService.eliminarMascota.and.returnValue(
      throwError(() => ({ error: { message: 'La mascota tiene citas asociadas' } }))
    );

    await component.eliminarMascota(mascota);

    expect(component.listMascotas).toEqual([mascota]);
    expect(swalFire).toHaveBeenCalledWith('No se pudo eliminar', 'La mascota tiene citas asociadas', 'error');
  });
});
