export interface Usuario {
  id: number;
  username: string;
  /** Nombre del perfil. */
  rol: string;
  rolCodigo: string;
  perfilId: number;
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
