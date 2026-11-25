import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import Swal from 'sweetalert2';

import { ClienteService, ClienteRq, MascotaDeCliente } from 'src/app/services/cliente.service';
import { AuthService } from 'src/app/services/auth.service';
import { Cliente } from 'src/app/models/cliente';
import { TablaDatos, mensajeError } from 'src/app/utils/tabla-datos';

/** Solo letras (con tildes), espacios, apóstrofos y guiones; mínimo 2 caracteres. */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]{1,99}$/;

/**
 * Valida que la fecha de nacimiento no sea futura ni anterior a 1900.
 *
 * @param c control con la fecha AAAA-MM-DD.
 * @returns error si la fecha no es válida.
 */
function fechaNacimientoValida(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '');
  if (!v) return null;
  const hoy = new Date().toISOString().slice(0, 10);
  return v > hoy || v < '1900-01-01' ? { fecha: true } : null;
}

/** Fila de la tabla con campos planos para buscar, filtrar y ordenar. */
type FilaCliente = Cliente & { nombreCompleto: string; documento: string; estadoTexto: string; estaActivo: boolean };

/**
 * Pantalla de gestión de clientes (propietarios de mascotas).
 *
 * <p>Reglas: documento único con formato válido, fecha de nacimiento entre 1900 y hoy, teléfono válido;
 * archivar conserva el historial e inactiva sus mascotas, y no se permite con citas futuras reservadas;
 * un cliente archivado puede reactivarse. El médico solo consulta.</p>
 */
@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {
  /** Servicio de clientes. */
  private readonly api = inject(ClienteService);
  /** Constructor de formularios reactivos. */
  private readonly fb = inject(FormBuilder);

  /** Servicio de sesión (permisos del usuario). */
  private readonly auth = inject(AuthService);
  /** Permiso CLIENTE_GESTIONAR: registrar, editar y reactivar. */
  readonly puedeModificar = this.auth.tienePermiso('CLIENTE_GESTIONAR');
  /** Permiso CLIENTE_ARCHIVAR. */
  readonly puedeArchivar = this.auth.tienePermiso('CLIENTE_ARCHIVAR');
  /** Tipos de documento permitidos. */
  readonly tipos = [
    { id: 'CC', nombre: 'Cédula de ciudadanía' }, { id: 'TI', nombre: 'Tarjeta de identidad' },
    { id: 'CE', nombre: 'Cédula de extranjería' }, { id: 'PA', nombre: 'Pasaporte' },
    { id: 'NIT', nombre: 'NIT' }, { id: 'PPT', nombre: 'Permiso por protección temporal' }
  ];
  /** Fecha de hoy (AAAA-MM-DD) para limitar la fecha de nacimiento. */
  readonly hoy = new Date().toISOString().slice(0, 10);

  /** Tabla con búsqueda, orden y paginación. */
  readonly tabla = new TablaDatos<FilaCliente>(['nombreCompleto', 'documento', 'telefono', 'direccion'], 'nombreCompleto', 'asc');
  /** Filtro por estado ('' = todos). */
  filtroEstado = 'Activo';

  /** Formulario de registro y edición. */
  readonly formulario = this.fb.nonNullable.group({
    tipoDocumento: ['CC', Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{4,20}$/)]],
    nombres: ['', [Validators.required, Validators.pattern(SOLO_LETRAS)]],
    apellidos: ['', [Validators.required, Validators.pattern(SOLO_LETRAS)]],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
    genero: [''],
    telefono: ['', Validators.pattern(/^[0-9+ ()-]{7,20}$/)],
    direccion: ['', Validators.maxLength(500)]
  });

  /** Cliente en edición: null = formulario cerrado, 0 = nuevo. */
  editandoId: number | null = null;
  /** Cliente cuya ficha se muestra. */
  detalle: FilaCliente | null = null;
  /** Mascotas activas del cliente de la ficha. */
  mascotasDetalle: MascotaDeCliente[] = [];
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

  /** Configura el filtro de estado y carga los clientes. */
  ngOnInit(): void {
    this.tabla.filtroExtra = c => !this.filtroEstado || c.estadoTexto === this.filtroEstado;
    this.cargar();
  }

  /** Consulta los clientes. */
  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.api.listarClientes().subscribe({
      next: lista => {
        this.tabla.datos = lista.map(c => ({
          ...c,
          estaActivo: !!c.activo,
          estadoTexto: c.activo ? 'Activo' : 'Archivado',
          nombreCompleto: `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim(),
          documento: `${c.tipoDocumento ?? ''} ${c.numeroDocumento ?? ''}`.trim()
        }));
        this.cargando = false;
      },
      error: e => {
        this.error = mensajeError(e, 'No fue posible consultar los clientes.');
        this.cargando = false;
      }
    });
  }

  /** Número de clientes activos. */
  get activos(): number {
    return this.tabla.datos.filter(c => c.estaActivo).length;
  }

  /**
   * Edad calculada a partir de la fecha de nacimiento.
   *
   * @param fecha fecha de nacimiento.
   * @returns edad en años o null.
   */
  edad(fecha: string | Date | undefined): number | null {
    if (!fecha) return null;
    const n = new Date(String(fecha).slice(0, 10) + 'T00:00:00');
    const h = new Date();
    let anios = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) anios--;
    return anios;
  }

  /** Abre el formulario para registrar un cliente. */
  nuevo(): void {
    this.editandoId = 0;
    this.detalle = null;
    this.errorFormulario = '';
    this.formulario.reset();
  }

  /**
   * Abre el formulario con los datos del cliente.
   *
   * @param c cliente a editar.
   */
  editar(c: FilaCliente): void {
    this.editandoId = c.clienteId ?? null;
    this.detalle = null;
    this.errorFormulario = '';
    this.formulario.reset({
      tipoDocumento: c.tipoDocumento ?? 'CC', numeroDocumento: c.numeroDocumento ?? '', nombres: c.nombres ?? '',
      apellidos: c.apellidos ?? '', fechaNacimiento: String(c.fechaNacimiento ?? '').slice(0, 10), genero: c.genero ?? '',
      telefono: c.telefono ?? '', direccion: c.direccion ?? ''
    });
  }

  /** Cierra el formulario sin guardar. */
  cancelar(): void {
    this.editandoId = null;
  }

  /**
   * Indica si un campo es inválido y ya fue tocado.
   *
   * @param campo nombre del control.
   * @returns true si debe mostrarse el error.
   */
  invalido(campo: keyof typeof this.formulario.controls): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Valida y guarda el cliente (crea o actualiza). */
  guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.errorFormulario = 'Revisa los campos marcados.';
      return;
    }
    const v = this.formulario.getRawValue();
    const doc = v.numeroDocumento.trim();
    if (this.tabla.datos.some(c => c.clienteId !== this.editandoId && c.numeroDocumento === doc)) {
      this.errorFormulario = `Ya existe un cliente con el número de documento ${doc}.`;
      return;
    }
    if (v.tipoDocumento === 'TI' && (this.edad(v.fechaNacimiento) ?? 0) >= 18) {
      this.errorFormulario = 'La tarjeta de identidad corresponde a menores de edad; revisa el tipo de documento.';
      return;
    }
    const datos: ClienteRq = {
      tipoDocumento: v.tipoDocumento, numeroDocumento: doc, nombres: v.nombres.trim(), apellidos: v.apellidos.trim(),
      fechaNacimiento: v.fechaNacimiento, genero: v.genero || null, telefono: v.telefono.trim() || null,
      direccion: v.direccion.trim() || null
    };
    this.guardando = true;
    this.errorFormulario = '';
    this.api.guardar(datos, this.editandoId || undefined).subscribe({
      next: () => {
        this.guardando = false;
        this.aviso = `Cliente ${datos.nombres} ${datos.apellidos} ${this.editandoId ? 'actualizado' : 'registrado'}.`;
        this.editandoId = null;
        this.cargar();
      },
      error: e => {
        this.guardando = false;
        this.errorFormulario = mensajeError(e, 'No fue posible guardar el cliente.');
      }
    });
  }

  /**
   * Muestra la ficha del cliente con sus mascotas activas.
   *
   * @param c cliente seleccionado.
   */
  ver(c: FilaCliente): void {
    this.detalle = c;
    this.mascotasDetalle = [];
    this.api.mascotas(c.clienteId!).subscribe({
      next: m => (this.mascotasDetalle = m),
      error: () => (this.mascotasDetalle = [])
    });
  }

  /**
   * Archiva un cliente (y sus mascotas), previa confirmación.
   *
   * @param c cliente seleccionado.
   */
  archivar(c: FilaCliente): void {
    Swal.fire({
      title: '¿Archivar cliente?',
      text: `${c.nombreCompleto} y sus mascotas quedarán inactivos. Su historial se conserva.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Archivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.error = '';
      this.api.archivar(c.clienteId!).subscribe({
        next: () => {
          this.aviso = `${c.nombreCompleto} archivado.`;
          this.cargar();
        },
        error: e => (this.error = mensajeError(e, 'No fue posible archivar el cliente.'))
      });
    });
  }

  /**
   * Reactiva un cliente archivado.
   *
   * @param c cliente seleccionado.
   */
  reactivar(c: FilaCliente): void {
    this.error = '';
    this.api.reactivar(c.clienteId!).subscribe({
      next: () => {
        this.aviso = `${c.nombreCompleto} reactivado. Activa sus mascotas desde Gestión de Mascotas si corresponde.`;
        this.cargar();
      },
      error: e => (this.error = mensajeError(e, 'No fue posible reactivar el cliente.'))
    });
  }

  /** Limpia la búsqueda y el filtro. */
  limpiarFiltros(): void {
    this.tabla.busqueda = '';
    this.filtroEstado = '';
    this.tabla.reiniciar();
  }
}
