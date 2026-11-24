import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { crearTokenPrueba } from '../testing/jwt.testing';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  let service: SesionService;
  let navegar: jasmine.Spy;
  let alerta: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SesionService);
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    alerta = spyOn(Swal, 'fire');
  });

  afterEach(() => {
    service.detenerVigilancia();
    sessionStorage.removeItem('token');
  });

  it('avisa dos minutos antes y cierra la sesión al vencer', fakeAsync(() => {
    sessionStorage.setItem('token', crearTokenPrueba({ exp: Math.floor(Date.now() / 1000) + 300 }));
    service.iniciarVigilancia();
    tick(170_000);
    expect(alerta).not.toHaveBeenCalled();
    tick(11_000);
    expect(alerta.calls.mostRecent().args[0]).toBe('Tu sesión está por vencer');
    tick(120_000);
    expect(navegar).toHaveBeenCalledOnceWith(['/login']);
    expect(sessionStorage.getItem('token')).toBeNull();
  }));

  it('no hace nada después de detener la vigilancia', fakeAsync(() => {
    sessionStorage.setItem('token', crearTokenPrueba({ exp: Math.floor(Date.now() / 1000) + 300 }));
    service.iniciarVigilancia();
    service.detenerVigilancia();
    tick(400_000);
    expect(alerta).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  }));

  it('retira el fondo de los modales al expirar', () => {
    const fondo = document.createElement('div');
    fondo.className = 'modal-backdrop';
    document.body.append(fondo);
    service.expirar();
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });
});
