// angular import
import { Component, OnInit, inject, input } from '@angular/core';
import { Location } from '@angular/common';

// project import
import { NavigationItem } from '../../navigation';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { NavCollapseComponent } from '../nav-collapse/nav-collapse.component';

@Component({
  selector: 'app-nav-group',
  imports: [SharedModule, NavItemComponent, NavCollapseComponent],
  templateUrl: './nav-group.component.html',
  styleUrls: ['./nav-group.component.scss']
})
export class NavGroupComponent implements OnInit {
  private location = inject(Location);

  // public props
  readonly item = input.required<NavigationItem>();

  // life cycle event
  ngOnInit() {
    // at reload time active and trigger link
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
