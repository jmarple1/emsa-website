import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminEvent, ApiService, EventInput } from '../../../core/api.service';
import { formatLocal } from '../format-local';

const blank = (): EventInput => ({ title: '', starts_at: '', ends_at: '', location: '', description: '' });

// Officers add, edit, and delete events (the Events page lists upcoming ones).
@Component({
  selector: 'app-events-editor',
  imports: [FormsModule],
  templateUrl: './events-editor.html',
})
export class EventsEditor {
  private readonly api = inject(ApiService);

  readonly events = signal<AdminEvent[]>([]);
  readonly loading = signal(true);
  readonly editingId = signal<number | 'new' | null>(null);
  readonly confirmDelete = signal<number | null>(null);
  readonly errors = signal<Record<string, string>>({});
  readonly message = signal('');
  readonly saving = signal(false);
  readonly fmt = formatLocal;
  draft: EventInput = blank();

  constructor() {
    this.load();
  }

  load(): void {
    this.api.adminEvents().subscribe({
      next: (e) => { this.events.set(e ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.message.set("Couldn't load events."); },
    });
  }

  add(): void {
    this.draft = blank();
    this.errors.set({});
    this.editingId.set('new');
  }

  edit(e: AdminEvent): void {
    this.draft = {
      title: e.title, starts_at: e.starts_at, ends_at: e.ends_at ?? '',
      location: e.location ?? '', description: e.description ?? '',
    };
    this.errors.set({});
    this.editingId.set(e.id);
  }

  save(): void {
    const id = this.editingId();
    if (id === null) return;
    this.saving.set(true);
    const req = id === 'new' ? this.api.createEvent(this.draft) : this.api.updateEvent(id, this.draft);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.message.set(id === 'new' ? 'Event added. It is on the Events page now.' : 'Event saved.');
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.errors.set(e.error?.fields ?? { form: e.error?.error ?? 'Could not save. Please try again.' });
      },
    });
  }

  remove(e: AdminEvent): void {
    this.api.deleteEvent(e.id).subscribe({
      next: () => { this.confirmDelete.set(null); this.message.set('Event deleted.'); this.load(); },
      error: () => this.message.set('Could not delete. Please try again.'),
    });
  }
}
