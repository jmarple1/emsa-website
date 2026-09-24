import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImpactService } from '../../core/impact.service';

@Component({
  selector: 'app-what-we-do',
  imports: [RouterLink],
  templateUrl: './what-we-do.html',
})
export class WhatWeDo {
  protected readonly impact = inject(ImpactService);

  constructor() {
    this.impact.load();
  }
}
