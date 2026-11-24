import { Formula } from 'src/app/models/formula';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FormulaMedicaComponent } from './formula-medica.component';

describe('FormulaMedicaComponent', () => {
  let component: FormulaMedicaComponent;
  let fixture: ComponentFixture<FormulaMedicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaMedicaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('busca en las indicaciones sin distinguir tildes', () => {
    const formula = { medicamento: { id: 1, nombre: 'Amoxicilina' }, indicaciones: 'Después de comer' } as Formula;
    component.listFormulas = [formula, { ...formula, indicaciones: null }];
    component.terminoBusqueda = 'despues';
    expect(component.formulasFiltradas).toEqual([formula]);
  });
});
