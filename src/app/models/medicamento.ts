export class Medicamento {
	id!: number;
	nombre!: string;
	descripcion?: string | null;
	presentacion?: string | null;
	fechaCompra?: Date | string;
	fechaVence?: Date | string;
	fechaCreacionRegistro?: Date | string;
	fechaModificacionRegistro?: Date | string | null;
}