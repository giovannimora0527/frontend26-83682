import { ApplicationRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../login/service/auth.service';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from './service/usuario.service';
import { UsuarioComponent } from './usuario.component';

describe('UsuarioComponent', () => {
  let fixture: ComponentFixture<UsuarioComponent>;
  let component: UsuarioComponent;
  let service: jasmine.SpyObj<UsuarioService>;
  let alerta: jasmine.Spy;
  const usuarios: Usuario[] = [
    { id: 1, username: 'admin', email: 'admin@x.test', rol: 'Administrador', rolCodigo: 'ADMINISTRADOR', perfilId: 1, activo: true },
    { id: 2, username: 'secre', email: 'secre@x.test', rol: 'Recepcion', rolCodigo: 'SECRETARIA', perfilId: 2, activo: true }
  ];
  const valido = { username: ' nuevo ', email: 'nuevo@x.test', perfilId: 2, password: 'Clave2026*', confirmacion: 'Clave2026*' };

  beforeEach(() => {
    service = jasmine.createSpyObj<UsuarioService>('UsuarioService',
      ['listarUsuarios', 'listarPerfiles', 'crearUsuario', 'actualizarUsuario', 'cambiarEstado']);
    service.listarUsuarios.and.returnValue(of(usuarios));
    service.listarPerfiles.and.returnValue(of([
      { id: 1, codigo: 'ADMINISTRADOR', nombre: 'Administrador', activo: true },
      { id: 2, codigo: 'SECRETARIA', nombre: 'Recepcion', activo: true },
      { id: 3, codigo: 'MEDICO', nombre: 'Medico', activo: true }
    ]));
    service.crearUsuario.and.returnValue(of({}));
    service.actualizarUsuario.and.returnValue(of({}));
    service.cambiarEstado.and.returnValue(of({}));
    alerta = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
    TestBed.configureTestingModule({
      providers: [{ provide: UsuarioService, useValue: service }, { provide: AuthService, useValue: { obtenerUsuario: () => ({ sub: '1' }) } }]
    });
    fixture = TestBed.createComponent(UsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.querySelectorAll('ngb-modal-window, ngb-modal-backdrop').forEach((elemento) => elemento.remove()));

  function pulsar(texto: string, indice = 0): void {
    const botones = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).filter((b) => b.textContent?.trim() === texto);
    botones[indice].click();
    fixture.detectChanges();
  }

  it('muestra el nombre del perfil y no permite inactivar la cuenta propia', () => {
    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(filas[1].textContent).toContain('Recepcion');
    expect(filas[0].textContent).not.toContain('Inactivar');
    expect(filas[1].textContent).toContain('Inactivar');
  });

  it('crea con contraseña y sin enviar la confirmación', () => {
    pulsar('Nuevo usuario');
    component.form.setValue(valido);
    component.guardarUsuario();
    expect(service.crearUsuario).toHaveBeenCalledOnceWith({ username: 'nuevo', email: 'nuevo@x.test', perfilId: 2, password: 'Clave2026*' });
  });

  for (const password of ['', 'Corta1*', 'sinmayuscula1*', 'SINMINUSCULA1*', 'SinNumero**', 'SinSimbolo1', 'Aa1*' + 'ñ'.repeat(40)]) {
    it(`rechaza la contraseña "${password.slice(0, 16)}" al crear`, () => {
      pulsar('Nuevo usuario');
      component.form.setValue({ ...valido, password, confirmacion: password });
      component.guardarUsuario();
      expect(service.crearUsuario).not.toHaveBeenCalled();
    });
  }

  it('exige que la confirmación coincida', () => {
    pulsar('Nuevo usuario');
    component.form.setValue({ ...valido, confirmacion: 'Otra2026*' });
    component.guardarUsuario();
    expect(service.crearUsuario).not.toHaveBeenCalled();
  });

  it('edita sin contraseña y preselecciona su perfil', () => {
    pulsar('Editar', 1);
    expect(component.form.controls.perfilId.value).toBe(2);
    component.guardarUsuario();
    expect(service.actualizarUsuario).toHaveBeenCalledOnceWith({ id: 2, username: 'secre', email: 'secre@x.test', perfilId: 2 });
  });

  it('avisa que el usuario MEDICO debe vincularse', () => {
    pulsar('Nuevo usuario');
    component.form.controls.perfilId.setValue(3);
    TestBed.inject(ApplicationRef).tick();
    expect(document.querySelector('ngb-modal-window')?.textContent).toContain('módulo Médicos');
  });

  for (const [mensaje, campo] of [['El correo electrónico ya existe', 'email'], ['El nombre de usuario ya existe', 'username']] as const) {
    it(`muestra junto al campo: ${mensaje}`, () => {
      service.crearUsuario.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'x', detalles: [{ campo, mensaje }] } })));
      pulsar('Nuevo usuario');
      component.form.setValue(valido);
      component.guardarUsuario();
      expect(component.form.controls[campo].errors).toEqual({ servidor: mensaje });
    });
  }

  it('cambia el estado solo si se confirma', async () => {
    await component.cambiarEstado(usuarios[1]);
    expect(service.cambiarEstado).toHaveBeenCalledOnceWith(2, false);
    alerta.and.resolveTo({ isConfirmed: false, isDenied: false, isDismissed: true });
    await component.cambiarEstado(usuarios[1]);
    expect(service.cambiarEstado).toHaveBeenCalledTimes(1);
    await component.cambiarEstado(usuarios[0]);
    expect(service.cambiarEstado).toHaveBeenCalledTimes(1);
  });
});
