import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from 'src/app/models/usuario';
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

  constructor(private readonly usuarioService: UsuarioService) {
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
