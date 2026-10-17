import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClienteService } from '../cliente/service/cliente.service';
import { RazaService } from '../raza/service/raza.service';
import { MascotaService } from './service/mascota.service';

import { MascotaComponent } from './mascota.component';

describe('MascotaComponent', () => {
  let component: MascotaComponent;
  let fixture: ComponentFixture<MascotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MascotaComponent],
      providers: [
        { provide: MascotaService, useValue: { listarMascotas: () => of([]) } },
        { provide: ClienteService, useValue: { listarClientes: () => of([]) } },
        { provide: RazaService, useValue: { listarRazas: () => of([]) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MascotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
