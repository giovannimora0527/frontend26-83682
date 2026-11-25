import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { RazaService, RazaRegistro } from 'src/app/services/raza.service';
import { AuthService } from 'src/app/services/auth.service';
import { TablaDatos, mensajeError } from 'src/app/utils/tabla-datos';

/** Solo letras (con tildes), espacios, apóstrofos y guiones; mínimo 2 caracteres. */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]{1,99}$/;

/**
 * Pantalla de gestión de razas: listado con búsqueda, filtro por especie, orden y paginación,
 * registro y edición con validaciones, y eliminación solo de razas sin mascotas.
 */
@Component({
  selector: 'app-raza',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './raza.component.html',
  styleUrl: './raza.component.scss'
})
export class RazaComponent implements OnInit {
  /** Servicio del catálogo de razas. */
  private readonly api = inject(RazaService);
  /** Constructor de formularios reactivos. */
  private readonly fb = inject(FormBuilder);

  /** Indica si el usuario es administrador (único que puede eliminar). */
  readonly esAdmin = inject(AuthService).tienePermiso('RAZA_ELIMINAR');
  /** Permiso RAZA_GESTIONAR: registrar y editar razas. */
  readonly puedeGestionar = inject(AuthService).tienePermiso('RAZA_GESTIONAR');

  /** Tabla con búsqueda, orden y paginación. */
  readonly tabla = new TablaDatos<RazaRegistro>(['nombre', 'especie', 'razaId'], 'especie', 'asc');
  /** Especie seleccionada en el filtro ('' = todas). */
  filtroEspecie = '';

  /** Formulario de registro y edición. */
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(SOLO_LETRAS)]],
    especie: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(SOLO_LETRAS)]]
  });

  /** Raza en edición: null = formulario cerrado, 0 = nueva. */
  editandoId: number | null = null;
  /** Raza que se está editando (para avisar si tiene mascotas). */
  editando: RazaRegistro | null = null;
  /** Indica si se están cargando los datos. */
  cargando = false;
  /** Indica si se está guardando. */
  guardando = false;
  /** Mensaje de error general. */
  error = '';
  /** Mensaje de error del formulario. */
  errorFormulario = '';
  /** Mensaje de confirmación. */
  aviso = '';

  /** Carga las razas al abrir la pantalla. */
  ngOnInit(): void {
    this.tabla.filtroExtra = r => !this.filtroEspecie || r.especie === this.filtroEspecie;
    this.cargar();
  }

  /** Especies distintas registradas, para el filtro y las sugerencias del formulario. */
  get especies(): string[] {
    return [...new Set(this.tabla.datos.map(r => r.especie))].sort((a, b) => a.localeCompare(b, 'es'));
  }

  /** Total de mascotas en las razas filtradas. */
  get totalMascotas(): number {
    return this.tabla.filtradas.reduce((s, r) => s + Number(r.mascotas ?? 0), 0);
  }

  /** Consulta las razas en el backend. */
  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.api.listarRazas().subscribe({
      next: lista => {
        this.tabla.datos = lista;
        this.cargando = false;
      },
      error: e => {
        this.error = mensajeError(e, 'No fue posible consultar las razas.');
        this.cargando = false;
      }
    });
  }

  /** Abre el formulario para registrar una raza nueva. */
  nueva(): void {
    this.editandoId = 0;
    this.editando = null;
    this.errorFormulario = '';
    this.formulario.reset({ nombre: '', especie: this.filtroEspecie });
  }

  /**
   * Abre el formulario con los datos de la raza.
   *
   * @param raza raza a editar.
   */
  editar(raza: RazaRegistro): void {
    this.editandoId = raza.razaId;
    this.editando = raza;
    this.errorFormulario = '';
    this.formulario.reset({ nombre: raza.nombre, especie: raza.especie });
  }

  /** Cierra el formulario sin guardar. */
  cancelar(): void {
    this.editandoId = null;
    this.editando = null;
  }

  /**
   * Indica si un campo es inválido y ya fue tocado.
   *
   * @param campo nombre del control.
   * @returns true si debe mostrarse el error.
   */
  invalido(campo: 'nombre' | 'especie'): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Indica si se intenta cambiar la especie de una raza que ya tiene mascotas. */
  get cambiaEspecieConMascotas(): boolean {
    return !!this.editando && this.editando.mascotas > 0 &&
      this.formulario.controls.especie.value.trim().toLowerCase() !== this.editando.especie.toLowerCase();
  }

  /** Valida y guarda la raza (crea o actualiza). */
  guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.errorFormulario = 'Revisa los campos marcados.';
      return;
    }
    if (this.cambiaEspecieConMascotas) {
      this.errorFormulario = `No se puede cambiar la especie: la raza tiene ${this.editando!.mascotas} mascota(s).`;
      return;
    }
    const datos = this.formulario.getRawValue();
    const duplicada = this.tabla.datos.some(r => r.razaId !== this.editandoId &&
      r.nombre.toLowerCase() === datos.nombre.trim().toLowerCase() &&
      r.especie.toLowerCase() === datos.especie.trim().toLowerCase());
    if (duplicada) {
      this.errorFormulario = 'Ya existe esa raza para la especie indicada.';
      return;
    }
    this.guardando = true;
    this.errorFormulario = '';
    const peticion = this.editandoId ? this.api.actualizar(this.editandoId, datos) : this.api.crear(datos);
    peticion.subscribe({
      next: r => {
        this.guardando = false;
        this.aviso = `Raza ${r.nombre} (${r.especie}) ${this.editandoId ? 'actualizada' : 'registrada'}.`;
        this.editandoId = null;
        this.editando = null;
        this.cargar();
      },
      error: e => {
        this.guardando = false;
        this.errorFormulario = mensajeError(e, 'No fue posible guardar la raza.');
      }
    });
  }

  /**
   * Elimina una raza sin mascotas, previa confirmación.
   *
   * @param raza raza a eliminar.
   */
  eliminar(raza: RazaRegistro): void {
    if (raza.mascotas > 0) {
      this.error = `No se puede eliminar ${raza.nombre}: tiene ${raza.mascotas} mascota(s) registrada(s).`;
      return;
    }
    Swal.fire({
      title: '¿Eliminar raza?',
      text: `${raza.nombre} (${raza.especie}) se eliminará del catálogo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.api.eliminar(raza.razaId).subscribe({
        next: () => {
          this.aviso = `Raza ${raza.nombre} eliminada.`;
          this.cargar();
        },
        error: e => (this.error = mensajeError(e, 'No fue posible eliminar la raza.'))
      });
    });
  }

  /** Limpia la búsqueda y el filtro de especie. */
  limpiarFiltros(): void {
    this.tabla.busqueda = '';
    this.filtroEspecie = '';
    this.tabla.reiniciar();
  }
}
