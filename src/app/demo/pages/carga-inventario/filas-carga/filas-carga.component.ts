import { Component, computed, effect, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CargaInventario, FilaCarga } from 'src/app/models/carga-inventario';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { Tabla } from 'src/app/shared/utils/tabla.util';

type Vista = 'todas' | 'validas' | 'errores';

/** Resumen y filas de una carga, para la vista previa y para el detalle del historial. */
@Component({
  selector: 'app-filas-carga',
  imports: [FormsModule, BotonDescargaComponent, BotonOrdenComponent, PaginacionComponent],
  templateUrl: './filas-carga.component.html'
})
export class FilasCargaComponent {
  readonly carga = input.required<CargaInventario>();
  readonly vista = signal<Vista>('todas');
  readonly confirmada = computed(() => this.carga().estado.startsWith('CONFIRMADA'));

  readonly columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'numero_lote', titulo: 'Lote' },
    { clave: 'cantidad', titulo: 'Cantidad' },
    { clave: 'precio_compra', titulo: 'Compra' },
    { clave: 'precio_venta', titulo: 'Venta' },
    { clave: 'fecha_vencimiento', titulo: 'Vence' }
  ];
  readonly tabla = new Tabla<FilaCarga>(
    {
      fila: (fila) => fila.fila,
      ...Object.fromEntries(this.columnas.map(({ clave }) => [clave, (fila: FilaCarga) => fila.datos[clave]])),
      detalle: (fila) => [...fila.errores, ...fila.advertencias].map(({ campo, mensaje }) => `${campo} ${mensaje}`).join(' ')
    },
    'fila'
  );
  readonly vistas = computed(() => [
    { clave: 'todas' as Vista, titulo: `Todas (${this.carga().totalFilas})` },
    { clave: 'validas' as Vista, titulo: `Válidas (${this.carga().filasValidas})` },
    { clave: 'errores' as Vista, titulo: `Con error (${this.carga().filasConError})` }
  ]);

  constructor() {
    effect(() => {
      const vista = this.vista();
      this.tabla.items = (this.carga().filas ?? []).filter((fila) => vista === 'todas' || fila.valida === (vista === 'validas'));
      this.tabla.pagina = 1;
    });
  }

  conError(fila: FilaCarga): boolean {
    return !fila.valida || fila.errorImportacion !== null;
  }
}
