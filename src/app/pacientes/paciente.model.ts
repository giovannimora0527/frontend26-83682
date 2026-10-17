/**
 * Modelo (interface) que representa un Paciente tal como lo entrega y
 * lo espera el backend (PacienteDTO en Spring Boot).
 *
 * Usar una interface de TypeScript nos da autocompletado y evita errores
 * de tipeo al usar los campos del paciente en los componentes.
 */
export interface Paciente {
  /** Id del paciente. Es undefined cuando todavia no se ha guardado. */
  id?: number;

  /** Nombre de la mascota. */
  nombre: string;

  /** Especie de la mascota (Perro, Gato, etc). */
  especie: string;

  /** Raza de la mascota. */
  raza: string;

  /** Nombre del propietario de la mascota. */
  propietario: string;
  /** Propietario normalizado como relación de base de datos. */
  clienteId?: number;
  nombreCliente?: string;
}
