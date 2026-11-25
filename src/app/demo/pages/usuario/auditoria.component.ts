import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuarioService, RegistroAuditoria } from './service/usuario.service';
import { mensajeError } from 'src/app/utils/tabla-datos';

/** Trazabilidad: log central de operaciones sensibles con filtros, paginación y exportación CSV. */
@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html'
})
export class AuditoriaComponent implements OnInit {
  /** Servicio de usuarios (consulta del log). */
  private readonly api = inject(UsuarioService);

  /** Filtros de la consulta. */
  filtros = { desde: '', hasta: '', accion: '', usuario: '' };
  /** Página actual (desde 0). */
  pagina = 0;
  /** Registros de la página. */
  filas: RegistroAuditoria[] = [];
  /** Acciones registradas para el filtro. */
  acciones: string[] = [];
  /** Indica si hay más páginas. */
  hayMas = false;
  /** Indica si se está consultando. */
  cargando = false;
  /** Mensaje de error. */
  error = '';

  /** Consulta la primera página. */
  ngOnInit(): void {
    this.buscar(0);
  }

  /**
   * Consulta una página del log.
   *
   * @param pagina página desde 0.
   */
  buscar(pagina: number): void {
    this.cargando = true;
    this.error = '';
    this.api.auditoria({ ...this.filtros, pagina }).subscribe({
      next: r => { this.filas = r.filas; this.pagina = r.pagina; this.hayMas = r.hayMas; this.acciones = r.acciones; this.cargando = false; },
      error: e => { this.error = mensajeError(e, 'No fue posible consultar la trazabilidad.'); this.cargando = false; }
    });
  }

  /** Limpia los filtros y consulta de nuevo. */
  limpiar(): void {
    this.filtros = { desde: '', hasta: '', accion: '', usuario: '' };
    this.buscar(0);
  }

  /** Descarga la página consultada en CSV (Excel la abre directamente). */
  exportar(): void {
    const encabezado = ['Fecha', 'Usuario', 'Rol', 'Acción', 'Entidad', 'Id', 'Detalle', 'IP'];
    const celda = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lineas = this.filas.map(f => [f.fecha.replace('T', ' '), f.username, f.perfil, f.accion, f.entidad, f.entidadId, f.detalle, f.ip]
      .map(celda).join(';'));
    const blob = new Blob(['\ufeff' + [encabezado.join(';'), ...lineas].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trazabilidad.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
