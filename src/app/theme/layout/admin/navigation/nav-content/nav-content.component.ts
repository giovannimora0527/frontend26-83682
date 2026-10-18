// angular import
import { Component, inject, output } from '@angular/core';
import { Location } from '@angular/common';

// project import
import { environment } from 'src/environments/environment';
import { NavigationItem, NavigationItems } from '../navigation';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavGroupComponent } from './nav-group/nav-group.component';

@Component({
  selector: 'app-nav-content',
  imports: [SharedModule, NavGroupComponent],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent {
  private location = inject(Location);

  // public method
  // version
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;

  navigations!: NavigationItem[];
  wrapperWidth = 0;
  windowWidth = window.innerWidth;

  NavCollapsedMob = output();

  // constructor
  constructor() {
    this.navigations = NavigationItems;
  }

  fireOutClick() {
    const current_url = this.location.path();
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    let parent = ele?.parentElement ?? null;
    while (parent) {
      if (parent.classList.contains('pcoded-hasmenu')) {
        parent.classList.add('pcoded-trigger', 'active');
      }
      parent = parent.parentElement;
    }
  }
}
