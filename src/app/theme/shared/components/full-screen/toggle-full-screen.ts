// Angular import
import { Directive, ElementRef, HostListener, inject } from '@angular/core';

// project import
import screenfull from 'screenfull';

/** Directiva toggle full screen. */
@Directive({
  selector: '[appToggleFullScreen]'
})
export class ToggleFullScreenDirective {
  /** Dependencia inyectada (ElementRef). */
  private elements = inject(ElementRef);

  // public method
  /** Reacciona al evento click. */
  @HostListener('click')
  onClick() {
    if (screenfull.isEnabled) {
      this.elements.nativeElement.querySelector('.feather').classList.toggle('icon-maximize');
      this.elements.nativeElement.querySelector('.feather').classList.toggle('icon-minimize');
      screenfull.toggle();
    }

    if (isScreenFull(screenfull)) {
      if (screenfull.isFullscreen) {
        screenfull.exit();
      } else {
        screenfull.request();
      }
    }
  }
}

/**
 * Is screen full.
 *
 * @param sf sf.
 */
function isScreenFull(sf) {
  return sf.isFullscreen;
}
