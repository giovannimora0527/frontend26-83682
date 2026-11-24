// angular import
import { Component } from '@angular/core';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

/** Componente visual «basic collapse» de la plantilla de la aplicación. */
@Component({
  selector: 'app-basic-collapse',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './basic-collapse.component.html',
  styleUrls: ['./basic-collapse.component.scss']
})
export default class BasicCollapseComponent {
  // private props
  /** Indica si collapsed. */
  isCollapsed = true;
  /** Indica si multi collapsed1. */
  multiCollapsed1 = true;
  /** Indica si multi collapsed2. */
  multiCollapsed2 = true;
  /** Lorem text. */
  loremText =
    "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.";
}
