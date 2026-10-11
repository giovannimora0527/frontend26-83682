import { Component } from '@angular/core';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from './service/usuario.service';
import { TablaListadoComponent, Columna, fechaHora, soloFecha } from 'src/app/demo/shared/tabla-listado/tabla-listado.component';

@Component({
  selector: 'app-usuario',
  imports: [TablaListadoComponent],
  templateUrl: './usuario.component.html'
})
export class UsuarioComponent {
  titulo = 'Usuarios';
  items: Usuario[] = [];
  columnas: Columna[] = [
    { titulo: 'Usuario', valor: (c: Usuario) => c.username },
    { titulo: 'Correo', valor: (c: Usuario) => c.email },
    { titulo: 'Rol', valor: (c: Usuario) => c.rol },
    { titulo: 'Fecha de creación', valor: (c: Usuario) => fechaHora(c.fechaCreacion) },
    { titulo: 'Activo', valor: (c: Usuario) => c.activo ? 'Sí' : 'No' }
  ];

  constructor(private readonly servicio: UsuarioService) {
    this.listar();
  }

  listar() {
    this.servicio.getUsuarios().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Error al obtener usuarios:', error)
    });
  }
}
