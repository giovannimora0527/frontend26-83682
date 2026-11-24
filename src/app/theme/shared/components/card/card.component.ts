// angular import
import { Component, Input, OnInit, input } from '@angular/core';
import { animate, AUTO_STYLE, state, style, transition, trigger } from '@angular/animations';

// bootstrap import
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

/** Componente visual «card» de la plantilla de la aplicación. */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  animations: [
    trigger('collapsedCard', [
      state(
        'collapsed, void',
        style({
          overflow: 'hidden',
          height: '0px'
        })
      ),
      state(
        'expanded',
        style({
          overflow: 'hidden',
          height: AUTO_STYLE
        })
      ),
      transition('collapsed <=> expanded', [animate('400ms ease-in-out')])
    ]),
    trigger('cardRemove', [
      state(
        'open',
        style({
          opacity: 1
        })
      ),
      state(
        'closed',
        style({
          opacity: 0,
          display: 'none'
        })
      ),
      transition('open <=> closed', animate('400ms'))
    ])
  ]
})
export class CardComponent implements OnInit {
  // public props
  /** Card title. */
  cardTitle = input<string>('Card Title');
  /** Block class. */
  /** Card class. */
  @Input() cardClass: string;
  blockClass = input<string>();
  /** Header class. */
  headerClass = input<string>();
  /** Options. */
  options = input<boolean>(true);
  /** Indica si hid header. */
  hidHeader = input<boolean>(false);
  /** Custom header. */
  customHeader = input<boolean>(false);

  /** Animation. */
  animation: string;
  /** Full icon. */
  fullIcon: string;
  /** Indica si animating. */
  isAnimating: boolean;
  /** Indica si collapsed card. */
  collapsedCard: string;
  /** Indica si collapsed icon. */
  collapsedIcon: string;
  /** Indica si load card. */
  loadCard: boolean;
  /** Card remove. */
  cardRemove: string;

  // constructor
  /** Crea la instancia con sus dependencias inyectadas. */
  constructor() {
    this.fullIcon = 'icon-maximize';
    this.isAnimating = false;
    this.collapsedCard = 'expanded';
    this.collapsedIcon = 'icon-minus';
    this.loadCard = false;
    this.cardRemove = 'open';
  }

  // life cycle event
  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit() {
    if (!this.options || this.hidHeader || this.customHeader) {
      this.collapsedCard = 'false';
    }
  }

  // public method
  /**
   * Alterna pantalla completa card toggle.
   *
   * @param element element.
   * @param animation animation.
   * @param status status.
   */
  fullCardToggle(element: HTMLElement, animation: string, status: boolean) {
    animation = this.cardClass === 'full-card' ? 'zoomOut' : 'zoomIn';
    this.fullIcon = this.cardClass === 'full-card' ? 'icon-maximize' : 'icon-minimize';
    this.cardClass = this.cardClass === 'full-card' ? this.cardClass : 'full-card';
    if (status) {
      this.animation = animation;
    }
    this.isAnimating = true;

    setTimeout(() => {
      this.cardClass = animation === 'zoomOut' ? '' : this.cardClass;
      if (this.cardClass === 'full-card') {
        document.querySelector('body').style.overflow = 'hidden';
      } else {
        document.querySelector('body').removeAttribute('style');
      }
    }, 500);
  }

  /** Contrae o expande card toggle. */
  collapsedCardToggle() {
    this.collapsedCard = this.collapsedCard === 'collapsed' ? 'expanded' : 'collapsed';
    this.collapsedIcon = this.collapsedCard === 'collapsed' ? 'icon-plus' : 'icon-minus';
  }

  /** Acción de la tarjeta refresh. */
  cardRefresh() {
    this.loadCard = true;
    this.cardClass = 'card-load';
    setTimeout(() => {
      this.loadCard = false;
      this.cardClass = 'expanded';
    }, 3000);
  }

  /** Acción de la tarjeta remove action. */
  cardRemoveAction() {
    this.cardRemove = this.cardRemove === 'closed' ? 'open' : 'closed';
  }
}
