import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HistorialTarifa } from 'src/app/models/tarifa';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { FechaHoraPipe, MonedaPipe } from 'src/app/shared/pipes/formato.pipes';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { TarifaService } from '../service/tarifa.service';

@Component({
  selector: 'app-historial-tarifas',
  imports: [FormsModule, BotonOrdenComponent, FiltroFechasComponent, PaginacionComponent, FechaHoraPipe, MonedaPipe],
  templateUrl: './historial-tarifas.component.html'
})
export class HistorialTarifasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tarifaService = inject(TarifaService);
  private consulta?: Subscription;
  private cambios: HistorialTarifa[] = [];
  private rango: RangoFechas = { desde: '', hasta: '' };

  readonly columnas = [
    { clave: 'fecha', titulo: 'Fecha' }, { clave: 'servicio', titulo: 'Servicio' }, { clave: 'valor', titulo: 'Valor' }, { clave: 'iva', titulo: 'IVA' },
    { clave: 'motivo', titulo: 'Motivo' }, { clave: 'usuario', titulo: 'Usuario' }
  ];
  readonly tabla = new Tabla<HistorialTarifa>(
    {
      fecha: (c) => c.fecha, servicio: (c) => c.servicioNombre, valor: (c) => c.valorNuevo, iva: (c) => c.ivaNuevo, motivo: (c) => c.motivo,
      usuario: (c) => c.usuario
    },
    'fecha'
  );
  servicioId: number | null = null;
  cargando = false;
  error = '';

  constructor() {
    this.tabla.direccion = 'desc';
    this.listar();
  }

  get servicios(): { id: number; nombre: string }[] {
    const porId = new Map(this.cambios.map(({ servicioId, servicioNombre }) => [servicioId, servicioNombre]));
    return [...porId].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  filtrarFechas(rango: RangoFechas | null): void {
    if (rango) {
      this.rango = rango;
      this.listar();
    }
  }

  filtrarServicio(): void {
    this.tabla.items = this.cambios.filter(({ servicioId }) => this.servicioId === null || servicioId === this.servicioId);
  }

  listar(): void {
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.consulta = this.tarifaService.historial(this.rango).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cambios) => {
        this.cambios = cambios;
        if (!cambios.some(({ servicioId }) => servicioId === this.servicioId)) {
          this.servicioId = null;
        }
        this.filtrarServicio();
        this.cargando = false;
      },
      error: (error) => {
        this.error = mensajeError(error, 'No fue posible cargar el historial de tarifas.');
        this.cargando = false;
      }
    });
  }
}
