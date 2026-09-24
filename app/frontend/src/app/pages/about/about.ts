import { Component, inject } from '@angular/core';
import { ImpactService } from '../../core/impact.service';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
})
export class About {
  protected readonly impact = inject(ImpactService);

  constructor() {
    this.impact.load();
  }
}
