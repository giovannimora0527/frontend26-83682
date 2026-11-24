// angular import
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// project import
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ConfigurationComponent } from 'src/app/theme/layout/admin/configuration/configuration.component';
import { getNavigationItems } from './navigation/navigation';
import { AuthService } from 'src/app/demo/pages/login/service/auth.service';
import { SesionService } from 'src/app/services/sesion.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-admin',
  imports: [NavBarComponent, NavigationComponent, RouterModule, CommonModule, ConfigurationComponent, BreadcrumbsComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly sesionService = inject(SesionService);

  readonly usuario = inject(AuthService).obtenerUsuario();
  /** Accesos rápidos: los módulos que el usuario tiene autorizados. */
  readonly accesos = getNavigationItems().flatMap((grupo) => grupo.children ?? []);

  // public props
  navCollapsed = false;
  navCollapsedMob: boolean;
  windowWidth: number;

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  ngOnInit(): void {
    this.sesionService.iniciarVigilancia();
  }

  ngOnDestroy(): void {
    this.sesionService.detenerVigilancia();
  }

  get isHome(): boolean {
    return this.router.url === '/inicio';
  }

  // public method
  navMobClick() {
    if (this.navCollapsedMob && !document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
  }

  // this is for eslint rule
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    const navigation = document.querySelector('app-navigation.pcoded-navbar');
    if (navigation?.classList.contains('mob-open')) {
      navigation.classList.remove('mob-open');
    }
  }
}
