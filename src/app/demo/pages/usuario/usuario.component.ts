import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from 'src/app/models/usuario';
import { getApiErrorMessage } from 'src/app/services/backend.service';
import { UsuarioService } from './service/usuario.service';

@Component({
  selector: 'app-usuario',
  imports: [CommonModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent {
  usuarios: Usuario[] = [];
  cargando = true;
  error = '';
  mensaje = '';
  desactivandoId: number | null = null;
  terminoBusqueda = '';

  constructor(private readonly usuarioService: UsuarioService) {
    this.cargarUsuarios();
  }

  get usuariosFiltrados(): Usuario[] {
    const termino = this.terminoBusqueda.trim().toLocaleLowerCase();
    if (!termino) {
      return this.usuarios;
    }

    return this.usuarios.filter((usuario) =>
      `${usuario.id ?? ''} ${usuario.username ?? ''} ${usuario.rol ?? ''} ${usuario.email ?? ''}`
        .toLocaleLowerCase()
        .includes(termino)
    );
  }

  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
  }

  desactivarUsuario(usuario: Usuario): void {
    if (usuario.id === undefined || usuario.activo === false || this.desactivandoId !== null) {
      return;
    }
    if (!window.confirm(`¿Desactivar el usuario "${usuario.username ?? usuario.id}"?`)) {
      return;
    }

    this.desactivandoId = usuario.id;
    this.error = '';
    this.mensaje = '';
    this.usuarioService.desactivarUsuario(usuario.id).subscribe({
      next: () => {
        this.mensaje = 'El usuario se desactivó correctamente.';
        this.cargarUsuarios();
      },
      error: (error: unknown) => {
        console.error('Error al desactivar el usuario:', error);
        this.error = getApiErrorMessage(error, 'No fue posible desactivar el usuario.');
        this.desactivandoId = null;
      },
      complete: () => {
        this.desactivandoId = null;
      }
    });
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener los usuarios:', error);
        this.error = 'No fue posible cargar los usuarios.';
        this.cargando = false;
      }
    });
  }
}
