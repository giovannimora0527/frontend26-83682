import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MedicoComponent } from './medico.component';

const API = 'http://localhost:8080/clinica/v1';

describe('MedicoComponent', () => {
  let component: MedicoComponent;
  let fixture: ComponentFixture<MedicoComponent>;
  let http: HttpTestingController;

  const medico = {
    veterinarioId: 1, tipoDocumento: 'CC', numeroDocumento: '1001001001', nombres: 'Juan', apellidos: 'Pérez Gómez',
    telefono: '3001234567', registroProfesional: 'RP-1001',
    especializacion: { id: 13, nombre: 'Reumatología', descripcion: '', codigoEspecializacion: 'COD_13' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MedicoComponent);
    component = fixture.componentInstance;
    http.expectOne(`${API}/veterinarios`).flush([medico]);
    http.expectOne(`${API}/especializaciones`).flush([
      { id: 2, nombre: 'Neurología' }, { id: 13, nombre: 'Reumatología' }
    ]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const campos = () => {
    const el = fixture.nativeElement as HTMLElement;
    return ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'telefono', 'registroProfesional', 'especializacionId']
      .map((id) => el.querySelector(`#modalCrearMedico #${id}`) as HTMLInputElement | HTMLSelectElement | null);
  };

  it('el modal muestra los siete campos del médico y las especializaciones', () => {
    component.nuevoMedico('C');
    fixture.detectChanges();
    expect(campos().every((c) => c !== null)).toBeTrue();
    const opciones = (fixture.nativeElement as HTMLElement).querySelectorAll('#especializacionId option');
    expect(opciones.length).toBe(3); // placeholder + 2 especializaciones
    expect(component.titleBoton).toBe('Guardar Médico');
  });

  it('crear envía POST /veterinarios con las columnas de la tabla medico', () => {
    component.nuevoMedico('C');
    component.guardarMedico();
    http.expectNone(`${API}/veterinarios`);

    component.form.patchValue({
      tipoDocumento: 'CE', numeroDocumento: '777', nombres: ' Sofía ', apellidos: 'Pardo',
      telefono: '', registroProfesional: 'RP-77', especializacionId: 2
    });
    component.guardarMedico();
    const peticion = http.expectOne((r) => r.method === 'POST' && r.url === `${API}/veterinarios`);
    expect(peticion.request.body).toEqual({
      tipoDocumento: 'CE', numeroDocumento: '777', nombres: 'Sofía', apellidos: 'Pardo',
      telefono: null, registroProfesional: 'RP-77', especializacionId: 2
    });
    peticion.flush({ ...medico, veterinarioId: 14 });
    http.expectOne(`${API}/veterinarios`).flush([medico]);
  });

  it('editar carga los datos del médico, los muestra en el formulario y envía PUT', () => {
    const fila = (fixture.nativeElement as HTMLElement).querySelector('table tbody tr button') as HTMLButtonElement;
    fila.click();
    fixture.detectChanges();
    expect(component.titleBoton).toBe('Actualizar Médico');
    const [tipo, numero, nombres, , telefono, registro, especializacion] = campos();
    expect(tipo?.value).toContain('CC');
    expect(numero?.value).toBe('1001001001');
    expect(nombres?.value).toBe('Juan');
    expect(telefono?.value).toBe('3001234567');
    expect(registro?.value).toBe('RP-1001');
    expect(component.form.value.especializacionId).toBe(13);
    expect((especializacion as HTMLSelectElement).selectedOptions[0].textContent).toContain('Reumatología');

    component.form.patchValue({ apellidos: 'Pérez Ruiz' });
    component.guardarMedico();
    const peticion = http.expectOne((r) => r.method === 'PUT' && r.url === `${API}/veterinarios/1`);
    expect(peticion.request.body.apellidos).toBe('Pérez Ruiz');
    expect(peticion.request.body.especializacionId).toBe(13);
    peticion.flush({ ...medico, apellidos: 'Pérez Ruiz' });
    http.expectOne(`${API}/veterinarios`).flush([{ ...medico, apellidos: 'Pérez Ruiz' }]);
  });

  it('ordena cada columna ascendente y descendente sin romper búsqueda ni paginación', () => {
    const esp = (nombre: string) => ({ id: 1, nombre, descripcion: '', codigoEspecializacion: 'X' });
    component.listMedicos = [
      { id: 1, nombres: 'Carlos', apellidos: 'Zapata', especializacion: esp('Neurología'), registroProfesional: 'RP-10', tipoDocumento: 'CC', numeroDocumento: '30', telefono: '' },
      { id: 2, nombres: 'ana', apellidos: 'Martínez', especializacion: esp('Cardiología'), registroProfesional: 'RP-2', tipoDocumento: 'CE', numeroDocumento: '100', telefono: '' },
      { id: 3, nombres: 'Álvaro', apellidos: 'López', especializacion: esp('Pediatría'), registroProfesional: 'RP-1', tipoDocumento: 'PA', numeroDocumento: '4', telefono: '' },
      ...Array.from({ length: 4 }, (_, i) => ({ id: 10 + i, nombres: `Zoe ${i}`, apellidos: 'Ruiz', especializacion: esp('Oncología'),
        registroProfesional: `RP-9${i}`, tipoDocumento: 'CC', numeroDocumento: `9${i}`, telefono: '' }))
    ] as never;
    const ids = () => component.medicoFiltrados.map((m) => m.id);

    // Por defecto: nombres ascendente, sin distinguir mayúsculas ni tildes (como en Mascotas).
    expect(ids().slice(0, 3)).toEqual([3, 2, 1]);
    component.ordenarPor('nombres');
    expect(component.direccionOrden).toBe('desc');
    expect(ids().slice(-3)).toEqual([1, 2, 3]);

    const casos: [Parameters<MedicoComponent['ordenarPor']>[0], number[]][] = [
      ['apellidos', [3, 2]], ['especializacion', [2, 1]], ['registroProfesional', [3, 2, 1]],
      ['numeroDocumento', [3, 1]]
    ];
    // Tipo de documento tiene empates (varios CC): se verifican los valores en ambos sentidos.
    component.ordenarPor('tipoDocumento');
    expect(component.medicoFiltrados.map((m) => m.tipoDocumento)).toEqual(['CC', 'CC', 'CC', 'CC', 'CC', 'CE', 'PA']);
    component.ordenarPor('tipoDocumento');
    expect(component.medicoFiltrados.map((m) => m.tipoDocumento)).toEqual(['PA', 'CE', 'CC', 'CC', 'CC', 'CC', 'CC']);
    for (const [columna, primeros] of casos) {
      component.ordenarPor(columna);
      expect(component.direccionOrden).withContext(columna).toBe('asc');
      expect(ids().slice(0, primeros.length)).withContext(`${columna} asc`).toEqual(primeros);
      component.ordenarPor(columna);
      expect(component.direccionOrden).withContext(columna).toBe('desc');
      expect(ids().slice(-primeros.length).reverse()).withContext(`${columna} desc`).toEqual(primeros);
    }

    // Ordenar reinicia la página y la paginación sigue usando el orden aplicado.
    component.cambiarPagina(2);
    component.ordenarPor('numeroDocumento');
    expect(component.paginaActual).toBe(1);
    expect(component.totalPaginas).toBe(2);
    expect(component.medicoPaginados.length).toBe(5);

    // La búsqueda filtra y el resultado conserva el orden elegido.
    component.terminoBusqueda = 'zoe';
    expect(ids()).toEqual([10, 11, 12, 13]);
    component.ordenarPor('numeroDocumento');
    expect(ids()).toEqual([13, 12, 11, 10]);

    // La vista marca la columna activa con la flecha correspondiente.
    fixture.detectChanges();
    const icono = (fixture.nativeElement as HTMLElement).querySelector('th[aria-sort="descending"] i');
    expect(icono?.classList).toContain('fa-sort-down');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('th .fa-sort').length).toBe(5);
  });

  it('muestra el mensaje del backend cuando el documento está duplicado', () => {
    component.nuevoMedico('C');
    component.form.patchValue({
      tipoDocumento: 'CC', numeroDocumento: '1001001001', nombres: 'X', apellidos: 'Y',
      registroProfesional: 'RP-X', especializacionId: 2
    });
    component.guardarMedico();
    http.expectOne((r) => r.method === 'POST').flush(
      { status: 409, error: 'CONFLICT', message: 'Ya existe un médico con el número de documento 1001001001' },
      { status: 409, statusText: 'Conflict' });
    expect(component.respuestaError).toContain('Ya existe un médico');
    expect(component.enviando).toBeFalse();
  });
});
