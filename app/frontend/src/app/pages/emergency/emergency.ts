import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-emergency',
  imports: [RouterLink],
  templateUrl: './emergency.html',
})
export class Emergency {
  protected readonly content = inject(ContentService);

  constructor() {
    this.content.load();
  }
}
