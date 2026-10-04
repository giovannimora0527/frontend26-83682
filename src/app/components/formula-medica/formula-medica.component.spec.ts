import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FormulaMedicaService } from 'src/app/services/formula-medica.service';
import { FormulaMedicaComponent } from './formula-medica.component';

describe('FormulaMedicaComponent', () => {
  let component: FormulaMedicaComponent;
  let fixture: ComponentFixture<FormulaMedicaComponent>;
  let formulaMedicaService: jasmine.SpyObj<FormulaMedicaService>;

  beforeEach(async () => {
    formulaMedicaService = jasmine.createSpyObj<FormulaMedicaService>(
      'FormulaMedicaService',
      ['listar', 'crear', 'actualizar']
    );
    formulaMedicaService.listar.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FormulaMedicaComponent],
      providers: [{ provide: FormulaMedicaService, useValue: formulaMedicaService }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormulaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and loads the formula list', () => {
    expect(component).toBeTruthy();
    expect(formulaMedicaService.listar).toHaveBeenCalled();
    expect(component.formulas).toEqual([]);
  });

  it('shows the requested table columns', () => {
    const tableText = fixture.nativeElement.querySelector('table').textContent;

    expect(tableText).toContain('ID');
    expect(tableText).toContain('Dosis');
    expect(tableText).toContain('Indicaciones');
    expect(tableText).toContain('Fecha de inicio');
    expect(tableText).toContain('Fecha de fin');
  });
});
