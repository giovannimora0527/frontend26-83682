import { Component, Input, OnInit, input } from '@angular/core';
import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

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
      transition('collapsed <=> expanded', [
        animate('400ms ease-in-out')
      ])
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
  cardTitle = input<string>('Card Title');

  @Input() cardClass = '';
  blockClass = input<string>();
  headerClass = input<string>();
  options = input<boolean>(true);
  hidHeader = input<boolean>(false);
  customHeader = input<boolean>(false);

  animation = '';
  fullIcon = 'icon-maximize';
  isAnimating = false;
  collapsedCard = 'expanded';
  collapsedIcon = 'icon-minus';
  loadCard = false;
  cardRemove = 'open';

  constructor() {}

  ngOnInit(): void {
    if (
      !this.options() ||
      this.hidHeader() ||
      this.customHeader()
    ) {
      this.collapsedCard = 'false';
    }
  }

  fullCardToggle(
    element: HTMLElement,
    animation: string,
    status: boolean
  ): void {
    animation =
      this.cardClass === 'full-card' ? 'zoomOut' : 'zoomIn';

    this.fullIcon =
      this.cardClass === 'full-card'
        ? 'icon-maximize'
        : 'icon-minimize';

    this.cardClass =
      this.cardClass === 'full-card'
        ? this.cardClass
        : 'full-card';

    if (status) {
      this.animation = animation;
    }

    this.isAnimating = true;

    setTimeout(() => {
      this.cardClass =
        animation === 'zoomOut' ? '' : this.cardClass;

      const body = document.querySelector('body');

      if (body) {
        if (this.cardClass === 'full-card') {
          body.style.overflow = 'hidden';
        } else {
          body.removeAttribute('style');
        }
      }

      this.isAnimating = false;
    }, 500);
  }

  collapsedCardToggle(): void {
    this.collapsedCard =
      this.collapsedCard === 'collapsed'
        ? 'expanded'
        : 'collapsed';

    this.collapsedIcon =
      this.collapsedCard === 'collapsed'
        ? 'icon-plus'
        : 'icon-minus';
  }

  cardRefresh(): void {
    this.loadCard = true;
    this.cardClass = 'card-load';

    setTimeout(() => {
      this.loadCard = false;
      this.cardClass = 'expanded';
    }, 3000);
  }

  cardRemoveAction(): void {
    this.cardRemove =
      this.cardRemove === 'closed' ? 'open' : 'closed';
  }
}