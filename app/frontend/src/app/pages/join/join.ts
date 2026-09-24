import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { FormState } from '../../core/form-state';

const MIAMI_EMAIL = /^[A-Za-z0-9._%+\-]+@miamioh\.edu$/i;

@Component({
  selector: 'app-join',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './join.html',
})
export class Join {
  private readonly api = inject(ApiService);

  // Must match YEARS in backend/src/controllers/JoinController.cpp.
  readonly years = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Graduate student', 'Other'];
  readonly nextMeeting = signal<string | null>(null);

  readonly f = new FormState(
    inject(FormBuilder).nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      miami_email: ['', [Validators.required, Validators.pattern(MIAMI_EMAIL)]],
      year: ['', Validators.required],
      major: ['', [Validators.required, Validators.maxLength(200)]],
      emt_certified: [null as boolean | null, Validators.required],
      heard_from: ['', Validators.maxLength(500)],
    }),
    {
      name: { required: 'Enter your name.' },
      miami_email: { required: 'Enter your Miami email.', pattern: 'Enter your Miami email (ending in @miamioh.edu).' },
      year: { required: 'Choose your year.' },
      major: { required: 'Enter your major (or "Undecided").' },
      emt_certified: { required: "Tell us whether you're EMT certified." },
      heard_from: { maxlength: 'Keep this under 500 characters.' },
    },
    'join-form',
  );

  constructor() {
    this.api.nextMeeting().subscribe({
      next: (r) => this.nextMeeting.set(r.next_meeting),
      error: () => this.nextMeeting.set(null),
    });
  }

  submit(): void {
    this.f.submit((v) => this.api.join(v));
  }
}
