import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, EventItem } from '../../core/api.service';
import { formatWhen } from '../../core/format';

@Component({
  selector: 'app-events',
  imports: [RouterLink],
  templateUrl: './events.html',
})
export class Events {
  readonly events = signal<EventItem[]>([]);
  readonly when = formatWhen;

  constructor() {
    inject(ApiService).events().subscribe({ next: (e) => this.events.set(e), error: () => this.events.set([]) });
  }
}
