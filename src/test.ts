import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

import './app/demo/pages/usuario/usuario.component.spec';
import './app/demo/pages/usuario/service/usuario.service.spec';
import './app/demo/pages/cliente/cliente.component.spec';
import './app/demo/pages/mascota/mascota.component.spec';
import './app/demo/pages/mascota/service/mascota.service.spec';
import './app/demo/pages/medico/medico.component.spec';
