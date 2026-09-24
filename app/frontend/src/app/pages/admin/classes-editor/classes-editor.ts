import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminClass, ApiService, ClassInput } from '../../../core/api.service';
import { formatLocal } from '../format-local';

const blank = (): ClassInput => ({ course: 'BLS', starts_at: '', ends_at: '', location: '', capacity: 12, is_open: true });

// Officers add, edit, close, and delete classes. Registration stops by
// itself when a class is full; closing it stops registration early.
@Component({
  selector: 'app-classes-editor',
  imports: [FormsModule],
  templateUrl: './classes-editor.html',
})
export class ClassesEditor {
  private readonly api = inject(ApiService);

  readonly courses = ['BLS', 'Heartsaver', 'Stop the Bleed'];
  readonly classes = signal<AdminClass[]>([]);
  readonly loading = signal(true);
  readonly editingId = signal<number | 'new' | null>(null);
  readonly confirmDelete = signal<number | null>(null);
  readonly errors = signal<Record<string, string>>({});
  readonly message = signal('');
  readonly saving = signal(false);
  readonly fmt = formatLocal;
  draft: ClassInput = blank();

  constructor() {
    this.load();
  }

  load(): void {
    this.api.adminClasses().subscribe({
      next: (c) => { this.classes.set(c ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.message.set("Couldn't load classes."); },
    });
  }

  add(): void {
    this.draft = blank();
    this.errors.set({});
    this.editingId.set('new');
  }

  edit(c: AdminClass): void {
    const { course, starts_at, ends_at, location, capacity, is_open } = c;
    this.draft = { course, starts_at, ends_at, location, capacity, is_open };
    this.errors.set({});
    this.editingId.set(c.id);
  }

  cancel(): void {
    this.editingId.set(null);
  }

  /** Suggest a 3-hour class when the start is set and the end isn't. */
  startChanged(): void {
    if (this.draft.starts_at && !this.draft.ends_at) {
      const d = new Date(this.draft.starts_at);
      d.setHours(d.getHours() + 3);
      const p = (n: number) => String(n).padStart(2, '0');
      this.draft.ends_at = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
  }

  save(): void {
    const id = this.editingId();
    if (id === null) return;
    this.saving.set(true);
    const body = { ...this.draft, capacity: Number(this.draft.capacity) };
    const req = id === 'new' ? this.api.createClass(body) : this.api.updateClass(id, body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.message.set(id === 'new' ? 'Class added. It is on the CPR Classes page now.' : 'Class saved.');
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.errors.set(e.error?.fields ?? { form: e.error?.error ?? 'Could not save. Please try again.' });
      },
    });
  }

  remove(c: AdminClass): void {
    this.api.deleteClass(c.id).subscribe({
      next: () => { this.confirmDelete.set(null); this.message.set('Class deleted.'); this.load(); },
      error: () => this.message.set('Could not delete. Please try again.'),
    });
  }

  status(c: AdminClass): string {
    if (c.past) return 'Past';
    if (!c.is_open) return 'Closed';
    return c.registered >= c.capacity ? 'Full' : 'Open';
  }
}
