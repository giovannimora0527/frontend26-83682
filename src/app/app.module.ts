import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/**
 * Modulo principal (raiz) de la aplicacion.
 *
 * Aqui se "arranca" Angular y se declaran/importan los modulos que
 * necesita TODA la aplicacion (no solo un modulo de gestion en particular):
 *
 * - BrowserModule: necesario para correr Angular en el navegador.
 * - AppRoutingModule: contiene las rutas principales (el menu general).
 * - FormsModule: habilita [(ngModel)] para los formularios (dos vias).
 * - HttpClientModule: habilita HttpClient para consumir la API de Spring Boot.
 *
 * Los modulos de cada entidad (PacientesModule, CitasModule, etc) se
 * importan dentro de AppRoutingModule usando "lazy loading" (carga
 * perezosa), por eso no aparecen aqui.
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
