import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, ClassSession } from '../../core/api.service';
import { FormState } from '../../core/form-state';
import { ImpactService } from '../../core/impact.service';
import { formatWhen } from '../../core/format';

const MIAMI_EMAIL = /^[A-Za-z0-9._%+\-]+@miamioh\.edu$/i;

@Component({
  selector: 'app-cpr-classes',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './cpr-classes.html',
})
export class CprClasses {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly impact = inject(ImpactService);

  readonly courses = ['BLS', 'Heartsaver', 'Stop the Bleed'];
  readonly classes = signal<ClassSession[]>([]);
  readonly openClasses = computed(() => this.classes().filter((c) => c.seats_left > 0));
  readonly when = formatWhen;

  readonly reg = new FormState(
    this.fb.nonNullable.group({
      class_id: [null as number | null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      miami_email: ['', [Validators.required, Validators.pattern(MIAMI_EMAIL)]],
    }),
    {
      class_id: { required: 'Choose a class.' },
      name: { required: 'Enter your name.' },
      miami_email: { required: 'Enter your Miami email.', pattern: 'Enter your Miami email (ending in @miamioh.edu).' },
    },
    'register-form',
  );

  readonly grp = new FormState(
    this.fb.nonNullable.group({
      group_name: ['', [Validators.required, Validators.maxLength(200)]],
      contact_name: ['', [Validators.required, Validators.maxLength(200)]],
      contact_email: ['', [Validators.required, Validators.email]],
      preferred_dates: ['', [Validators.required, Validators.maxLength(1000)]],
      course: ['', Validators.required],
      headcount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(1000)]],
    }),
    {
      group_name: { required: "Enter your group's name." },
      contact_name: { required: 'Enter a contact name.' },
      contact_email: { required: 'Enter an email address.', email: 'Enter a valid email address.' },
      preferred_dates: { required: 'Tell us which dates work for your group.' },
      course: { required: 'Choose a course.' },
      headcount: { required: 'Enter how many people.', min: 'Enter at least 1.', max: 'Enter 1,000 or fewer.' },
    },
    'group-form',
  );

  constructor() {
    this.impact.load();
    this.loadClasses();
  }

  register(): void {
    // Refresh seat counts afterwards, whether it worked or the class filled up.
    this.reg.submit(
      ({ class_id, ...body }) => this.api.registerForClass(class_id, body),
      () => this.loadClasses(),
    );
  }

  requestGroup(): void {
    this.grp.submit((v) => this.api.requestGroupClass(v));
  }

  private loadClasses(): void {
    this.api.classes().subscribe({ next: (c) => this.classes.set(c), error: () => this.classes.set([]) });
  }
}
