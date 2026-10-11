// Cuerpo de la peticion para crear/actualizar una mascota (MascotaRq del backend).
export class MascotaRq {
    mascotaId?: number;
    nombreMascota?: string;
    edad?: number;
    razaId?: number;
    clienteId?: number;
}
