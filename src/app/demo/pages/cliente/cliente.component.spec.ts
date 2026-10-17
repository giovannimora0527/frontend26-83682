import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClienteService } from './service/cliente.service';
import { ClienteComponent } from './cliente.component';

describe('ClienteComponent', () => {
  let component: ClienteComponent;
  let fixture: ComponentFixture<ClienteComponent>;
  let clienteService: jasmine.SpyObj<ClienteService>;

  beforeEach(async () => {
    clienteService = jasmine.createSpyObj<ClienteService>('ClienteService', ['listarClientes']);
    clienteService.listarClientes.and.returnValue(of([
      { clienteId: 1, nombres: 'Sofía', apellidos: 'Gómez', numeroDocumento: '12345' },
      { clienteId: 2, nombres: 'Juan', apellidos: 'Pérez', numeroDocumento: '67890' }
    ]));

    await TestBed.configureTestingModule({
      imports: [ClienteComponent],
      providers: [{ provide: ClienteService, useValue: clienteService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filters clients by document and refreshes the list', () => {
    component.terminoBusqueda = '12345';
    expect(component.clientesFiltrados.length).toBe(1);
    expect(component.clientesFiltrados[0].nombres).toBe('Sofía');

    component.terminoBusqueda = 'not-found';
    expect(component.clientesFiltrados.length).toBe(0);

    fixture.nativeElement.querySelector('button').click();
    expect(clienteService.listarClientes).toHaveBeenCalledTimes(2);
  });
});
