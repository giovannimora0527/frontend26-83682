import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioService } from './service/usuario.service';

import { UsuarioComponent } from './usuario.component';

describe('UsuarioComponent', () => {
  let component: UsuarioComponent;
  let fixture: ComponentFixture<UsuarioComponent>;
  let usuarioService: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['getUsuarios']);
    usuarioService.getUsuarios.and.returnValue(of([
      { id: 1, username: 'ana', email: 'ana@example.com', rol: 'CLIENTE' }
    ]));

    await TestBed.configureTestingModule({
      imports: [UsuarioComponent],
      providers: [{ provide: UsuarioService, useValue: usuarioService }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters users and refreshes the list when requested', () => {
    component.terminoBusqueda = 'ANA@EXAMPLE';
    expect(component.usuariosFiltrados.length).toBe(1);

    component.terminoBusqueda = 'not-found';
    expect(component.usuariosFiltrados.length).toBe(0);

    fixture.nativeElement.querySelector('button').click();
    expect(usuarioService.getUsuarios).toHaveBeenCalledTimes(2);
  });
});
