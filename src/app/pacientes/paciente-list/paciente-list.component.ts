import { Component, OnInit } from '@angular/core';
import { Paciente } from '../paciente.model';
import { PacienteService } from '../paciente.service';

/**
 * Componente que muestra la lista de pacientes registrados, consultando
 * el backend al momento de cargar la pagina.
 */
@Component({
  selector: 'app-paciente-list',
  templateUrl: './paciente-list.component.html',
  styleUrls: ['./paciente-list.component.css']
})
export class PacienteListComponent implements OnInit {

  /** Lista de pacientes traida desde el backend. */
  pacientes: Paciente[] = [];

  /** Mensaje de error a mostrar si la peticion al backend falla. */
  mensajeError = '';

  /** Indica si la peticion al backend todavia esta en curso. */
  cargando = true;

  /**
   * @param pacienteService servicio inyectado para consultar el backend
   */
  constructor(private pacienteService: PacienteService) { }

  /**
   * Metodo del ciclo de vida de Angular que se ejecuta una sola vez,
   * apenas el componente termina de crearse. Es el lugar recomendado
   * para pedir datos al backend.
   */
  ngOnInit(): void {
    this.cargarPacientes();
  }

  /**
   * Pide la lista de pacientes al backend y actualiza el estado del
   * componente segun la respuesta sea exitosa o falle.
   */
  cargarPacientes(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.pacienteService.listar().subscribe({
      next: (datos) => {
        this.pacientes = datos;
        this.cargando = false;
      },
      error: (error) => {
        this.mensajeError = 'No se pudo cargar la lista de pacientes. Verifique que el backend este corriendo.';
        this.cargando = false;
        console.error(error);
      }
    });
  }
}
