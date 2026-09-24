import { Component, inject } from '@angular/core';
import { ImpactService } from '../../core/impact.service';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
})
export class About {
  protected readonly impact = inject(ImpactService);
  protected readonly content = inject(ContentService);

  constructor() {
    this.impact.load();
    this.content.load();
  }
}
