// angular import
import { Component, ElementRef, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

// project import
import { NavigationItem } from '../../navigation';
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-nav-item',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent {
  private location = inject(Location);
  private element = inject<ElementRef<HTMLElement>>(ElementRef);

  // public props
  item = input.required<NavigationItem>();

  // constructor

  // public method
  showMenuTooltip(tooltip: NgbTooltip) {
    if (window.matchMedia('(min-width: 992px)').matches && this.element.nativeElement.closest('.pcoded-navbar.navbar-collapsed')) {
      tooltip.open();
    }
  }

  closeOtherMenu(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const parent = target.closest('.pcoded-hasmenu');
    document.querySelectorAll('.pcoded-hasmenu').forEach((section) => {
      if (section !== parent) {
        section.classList.remove('active', 'pcoded-trigger');
      }
    });
    parent?.classList.add('pcoded-trigger', 'active');

    const navigation = document.querySelector('app-navigation.pcoded-navbar');
    if (navigation) {
      navigation.classList.remove('mob-open');
    }
  }
}
