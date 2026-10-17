import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Raza } from 'src/app/models/raza';
import { RazaService } from './service/raza.service';
import { getApiErrorMessage } from 'src/app/services/backend.service';

@Component({
  selector: 'app-raza',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './raza.component.html',
  styleUrl: './raza.component.scss'
})
export class RazaComponent {
  razas: Raza[] = [];
  cargando = true;
  guardando = false;
  eliminandoId: number | null = null;
  error = '';
  mensaje = '';
  terminoBusqueda = '';
  mostrarFormulario = false;
  razaEnEdicion: number | null = null;

  readonly formulario = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    especie: ['', [Validators.required, Validators.maxLength(100)]]
  });

  constructor(
    private readonly razaService: RazaService,
    private readonly formBuilder: FormBuilder
  ) {
    this.cargarRazas();
  }

  get razasFiltradas(): Raza[] {
    const termino = this.terminoBusqueda.trim().toLocaleLowerCase();
    if (!termino) {
      return this.razas;
    }

    return this.razas.filter((raza) =>
      `${raza.razaId} ${raza.nombre ?? ''} ${raza.especie ?? ''}`
        .toLocaleLowerCase()
        .includes(termino)
    );
  }

  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
  }

  nuevaRaza(): void {
    this.razaEnEdicion = null;
    this.formulario.reset({ nombre: '', especie: '' });
    this.mostrarFormulario = true;
    this.error = '';
    this.mensaje = '';
  }

  cambiarRaza(raza: Raza): void {
    if (raza.razaId === undefined) {
      this.error = 'No se puede cambiar una raza sin identificador.';
      return;
    }

    this.razaEnEdicion = raza.razaId;
    this.formulario.reset({
      nombre: raza.nombre ?? "",
      especie: raza.especie ?? ""
    });
    this.mostrarFormulario = true;
    this.error = '';
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.mostrarFormulario = false;
    this.razaEnEdicion = null;
    this.formulario.reset({ nombre: '', especie: '' });
    this.error = '';
  }

  guardarRaza(): void {
    if (this.formulario.invalid || this.guardando) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    const modoEdicion = this.razaEnEdicion !== null;
    const raza: Raza = {
      ...this.formulario.getRawValue(),
      ...(this.razaEnEdicion === null ? {} : { razaId: this.razaEnEdicion })
    };
    const solicitud = !modoEdicion
      ? this.razaService.guardarRaza(raza)
      : this.razaService.actualizarRaza(raza);

    solicitud.subscribe({
      next: () => {
        this.mensaje = modoEdicion ? 'La raza se actualizó correctamente.' : 'La raza se creó correctamente.';
        this.cancelarEdicion();
        this.cargarRazas();
      },
      error: (error: unknown) => {
        console.error('Error al guardar la raza:', error);
        this.error = 'No fue posible guardar la raza. Verifica los datos e inténtalo de nuevo.';
        this.guardando = false;
      },
      complete: () => {
        this.guardando = false;
      }
    });
  }

  eliminarRaza(raza: Raza): void {
    if (raza.razaId === undefined || this.eliminandoId !== null) {
      return;
    }
    if (!window.confirm(`¿Eliminar la raza "${raza.nombre ?? raza.razaId}"?`)) {
      return;
    }

    this.eliminandoId = raza.razaId;
    this.error = '';
    this.mensaje = '';
    this.razaService.eliminarRaza(raza.razaId).subscribe({
      next: () => {
        this.mensaje = 'La raza se eliminó correctamente.';
        this.cargarRazas();
      },
      error: (error: unknown) => {
        console.error('Error al eliminar la raza:', error);
        this.error = getApiErrorMessage(error, 'No fue posible eliminar la raza.');
        this.eliminandoId = null;
      },
      complete: () => {
        this.eliminandoId = null;
      }
    });
  }

  cargarRazas(): void {
    this.cargando = true;
    this.error = '';

    this.razaService.listarRazas().subscribe({
      next: (razas) => {
        this.razas = razas;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener las razas:', error);
        this.error = 'No fue posible cargar las razas.';
        this.cargando = false;
      }
    });
  }
}
