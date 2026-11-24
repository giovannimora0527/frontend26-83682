import { ApplicationRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../login/service/auth.service';
import { Cliente } from 'src/app/models/cliente';
import { ClienteComponent } from './cliente.component';
import { ClienteService } from './service/cliente.service';

describe('ClienteComponent', () => {
  let fixture: ComponentFixture<ClienteComponent>;
  let component: ClienteComponent;
  let service: jasmine.SpyObj<ClienteService>;
  const cliente: Cliente = {
    id: 4, tipoDocumento: 'CC', numeroDocumento: '1001', nombres: 'José', apellidos: 'Pérez', telefono: '3001112233',
    correo: 'jose@correo.test', direccion: 'Calle 1', fechaNacimiento: '1990-01-01', genero: null, activo: true, usuarioId: 8
  };
  const datos = {
    tipoDocumento: 'CC', numeroDocumento: '1001', nombres: 'José', apellidos: 'Pérez', fechaNacimiento: '1990-01-01',
    genero: null, telefono: '3001112233', correo: null, direccion: null
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<ClienteService>('ClienteService',
      ['listarClientes', 'crearCliente', 'actualizarCliente', 'listarMascotas', 'listarFacturas']);
    service.listarClientes.and.returnValue(of([cliente, { ...cliente, id: 5, nombres: 'Ana', numeroDocumento: '2002', correo: null }]));
    service.crearCliente.and.returnValue(of({}));
    service.actualizarCliente.and.returnValue(of({}));
    spyOn(Swal, 'fire');
    TestBed.configureTestingModule({
      providers: [{ provide: ClienteService, useValue: service }, { provide: AuthService, useValue: { tieneMenu: () => true } }]
    });
    fixture = TestBed.createComponent(ClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.querySelectorAll('ngb-modal-window, ngb-modal-backdrop').forEach((elemento) => elemento.remove()));

  const boton = (texto: string, raiz: ParentNode = fixture.nativeElement) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.includes(texto)) as HTMLButtonElement;

  function llenar(): void {
    component.form.setValue({ ...datos, nombres: ' José ', genero: '', correo: ' ', direccion: '' });
    component.form.controls.correo.setValue('');
  }

  it('lista y busca por documento, nombre sin tildes, correo y teléfono', () => {
    const filas = () => fixture.nativeElement.querySelectorAll('tbody tr').length;
    expect(filas()).toBe(2);
    for (const [termino, total] of [['2002', 1], ['jose perez', 1], ['jose@', 1], ['300111', 2], ['nadie', 0]] as const) {
      component.tabla.termino = termino;
      expect(component.tabla.filtradas.length).withContext(termino).toBe(total);
    }
  });

  it('abre el formulario desde el botón y lo muestra en modo edición con sus datos', () => {
    boton('Editar').click();
    TestBed.inject(ApplicationRef).tick();
    const modal = document.querySelector('ngb-modal-window')!;
    expect(modal.querySelector('h2')?.textContent).toBe('Editar cliente');
    expect(modal.querySelector<HTMLInputElement>('#cliente-documento')?.value).toBe('2002');
  });

  it('crea con los datos limpios y solo los campos que admite el backend', () => {
    llenar();
    component.guardarCliente();
    expect(service.crearCliente).toHaveBeenCalledOnceWith(datos);
    expect(service.listarClientes).toHaveBeenCalledTimes(2);
  });

  it('actualiza el cliente seleccionado', () => {
    boton('Editar').click();
    component.form.controls.nombres.setValue('Ana María');
    component.guardarCliente();
    expect(service.actualizarCliente).toHaveBeenCalledOnceWith(5, jasmine.objectContaining({ nombres: 'Ana María' }));
    expect(service.crearCliente).not.toHaveBeenCalled();
  });

  for (const [campo, valores] of [
    ['telefono', ['', '123456', '1234567890123456', '300abc1234']], ['correo', ['malo']], ['nombres', ['', '   ']],
    ['numeroDocumento', ['', 'a b']], ['fechaNacimiento', ['', '2999-01-01']], ['tipoDocumento', ['']]
  ] as const) {
    it(`valida ${campo}`, () => {
      for (const valor of valores) {
        llenar();
        component.form.controls[campo].setValue(valor);
        component.guardarCliente();
        expect(service.crearCliente).withContext(valor).not.toHaveBeenCalled();
      }
    });
  }

  it('muestra el documento duplicado junto al campo y permite corregirlo', () => {
    service.crearCliente.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 409, error: { message: 'El documento ya existe' } })));
    llenar();
    component.guardarCliente();
    expect(component.form.controls.numeroDocumento.errors).toEqual({ servidor: 'El documento ya existe' });
    expect(component.respuestaError).toBe('');
    component.form.controls.numeroDocumento.setValue('3003');
    expect(component.form.valid).toBeTrue();
  });

  it('reparte los errores de validación del backend por campo', () => {
    service.crearCliente.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { message: 'x', detalles: [{ campo: 'telefono', mensaje: 'Teléfono inválido' }] }
    })));
    llenar();
    component.guardarCliente();
    expect(component.form.controls.telefono.errors).toEqual({ servidor: 'Teléfono inválido' });
  });

  it('evita el doble envío', () => {
    const respuesta = new Subject<unknown>();
    service.crearCliente.and.returnValue(respuesta);
    llenar();
    component.guardarCliente();
    component.guardarCliente();
    expect(service.crearCliente).toHaveBeenCalledTimes(1);
    respuesta.complete();
    expect(component.enviando).toBeFalse();
  });

  it('muestra las mascotas y trata el 404 como lista vacía', () => {
    service.listarMascotas.and.returnValue(of([{ mascotaId: 1, nombreMascota: 'Firulais' }]));
    boton('Mascotas').click();
    TestBed.inject(ApplicationRef).tick();
    expect(service.listarMascotas).toHaveBeenCalledOnceWith(5);
    expect(document.querySelector('ngb-modal-window')?.textContent).toContain('Firulais');
    service.listarMascotas.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    boton('Mascotas').click();
    expect(component.errorConsulta).toBe('');
    expect(component.mascotas).toEqual([]);
  });

  it('muestra el error del listado y permite reintentar', () => {
    service.listarClientes.and.returnValue(throwError(() => new Error('x')));
    component.listar();
    fixture.detectChanges();
    service.listarClientes.and.returnValue(of([cliente]));
    boton('Reintentar').click();
    fixture.detectChanges();
    expect(component.errorListado).toBe('');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });
});
