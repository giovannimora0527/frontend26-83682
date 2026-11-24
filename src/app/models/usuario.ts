export interface Usuario {
  id: number;
  username: string;
  /** Nombre del perfil (o su código). */
  rol: string;
  email: string;
  fechaCreacion?: string;
  activo: boolean;
}

export interface UsuarioRq {
  id?: number;
  username: string;
  email: string;
  perfilId: number;
  password?: string;
}
