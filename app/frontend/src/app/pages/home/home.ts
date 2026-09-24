import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImpactService } from '../../core/impact.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  protected readonly impact = inject(ImpactService);

  constructor() {
    this.impact.load();
  }
}
