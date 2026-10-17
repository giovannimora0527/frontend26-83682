import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnotacionHistoria } from '../anotacion-historia.model';
import { AnotacionHistoriaService } from '../anotacion-historia.service';
import { VeterinarioService } from '../../veterinarios/veterinario.service';
import { Veterinario } from '../../veterinarios/veterinario.model';

/**
 * Componente con el formulario para crear o actualizar una anotacion de
 * historia medica. Se usa para las dos rutas:
 *   /anotaciones/nueva       -> crea una anotacion nueva
 *   /anotaciones/editar/:id  -> actualiza una anotacion existente
 */
@Component({
  selector: 'app-anotacion-form',
  templateUrl: './anotacion-form.component.html',
  styleUrls: ['./anotacion-form.component.css']
})
export class AnotacionFormComponent implements OnInit {

  /** Objeto que se va llenando con lo que el usuario escribe en el formulario. */
  anotacion: AnotacionHistoria = {
    descripcion: '',
    fecha: this.fechaLocalActual(), historiaMedicaId: 0, veterinarioId: 0, observacion: '', diagnosticoEvolucion: ''
  };
  veterinarios: Veterinario[] = [];

  /** Id de la anotacion que se esta editando (null si se esta creando una nueva). */
  idEdicion: number | null = null;

  /** Mensaje de error a mostrar si la operacion falla. */
  mensajeError = '';

  /** Indica si se esta guardando (para deshabilitar el boton y evitar doble click). */
  guardando = false;

  constructor(
    private anotacionHistoriaService: AnotacionHistoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private veterinarioService: VeterinarioService
  ) { }

  /**
   * Revisa si la ruta trae un id (modo edicion) para precargar los datos
   * de la anotacion seleccionada en la lista. Si no, revisa si llego el
   * query param "historiaId" (modo creacion desde el listado de una
   * historia medica especifica).
   */
  ngOnInit(): void {
    this.veterinarioService.listar().subscribe({ next: datos => this.veterinarios = datos.filter(v => v.activo), error: error => this.mensajeError = this.mensajeBackend(error, 'No se pudieron cargar los veterinarios.') });
    const idParametro = this.route.snapshot.paramMap.get('id');

    if (idParametro) {
      this.idEdicion = Number(idParametro);
      const seleccionada = this.anotacionHistoriaService.obtenerSeleccionada();
      if (seleccionada) {
        this.anotacion = { ...seleccionada };
      }
    } else {
      const historiaIdQuery = this.route.snapshot.queryParamMap.get('historiaId');
      if (historiaIdQuery) {
        this.anotacion.historiaMedicaId = Number(historiaIdQuery);
      }
    }
  }

  /** Fecha local en formato compatible con el control datetime-local. */
  private fechaLocalActual(): string { const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  /** Convierte errores de la API en mensajes claros. */
  private mensajeBackend(error: any, alternativo: string): string { return error?.error?.mensaje || error?.error?.message || error?.message || alternativo; }

  /**
   * Envia el formulario al backend: crea una anotacion nueva si no hay id
   * de edicion, o actualiza la existente si si lo hay.
   */
  guardar(): void {
    this.guardando = true;
    this.mensajeError = '';

    const operacion = this.idEdicion
      ? this.anotacionHistoriaService.actualizar(this.idEdicion, this.anotacion)
      : this.anotacionHistoriaService.crear(this.anotacion);

    operacion.subscribe({
      next: (resultado) => {
        this.router.navigate(['/anotaciones'], { queryParams: { historiaId: resultado.historiaMedicaId } });
      },
      error: (error) => {
        this.mensajeError = this.mensajeBackend(error, 'No se pudo guardar la anotación. Verifique los datos ingresados.');
        this.guardando = false;
        console.error(error);
      }
    });
  }
}
