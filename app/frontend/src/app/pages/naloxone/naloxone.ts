import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { FormState } from '../../core/form-state';
import { ImpactService } from '../../core/impact.service';
import { ContentService } from '../../core/content.service';

const nonEmpty = (c: AbstractControl): ValidationErrors | null =>
  Array.isArray(c.value) && c.value.length ? null : { required: true };

@Component({
  selector: 'app-naloxone',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './naloxone.html',
})
export class Naloxone {
  private readonly api = inject(ApiService);
  protected readonly impact = inject(ImpactService);
  protected readonly content = inject(ContentService);

  // Supplies named on this page. Values must match ITEMS in NaloxoneController.cpp.
  readonly items = [
    { value: 'naloxone', label: 'Naloxone (Narcan)' },
    { value: 'test_strips', label: 'Fentanyl test strips' },
    { value: 'condoms', label: 'Condoms' },
    { value: 'educational_materials', label: 'Educational materials' },
  ];

  readonly f = new FormState(
    inject(FormBuilder).nonNullable.group({
      requesting_for: ['', Validators.required],
      chapter_house: [''],
      items: [[] as string[], nonEmpty],
      pickup: ['', Validators.required],
      contact_method: [''],
    }),
    {
      requesting_for: { required: 'Choose who this request is for.' },
      chapter_house: { required: 'Enter your chapter house.' },
      items: { required: 'Choose at least one item.' },
      pickup: { required: "Choose how you'd like to get it." },
      contact_method: { required: 'Tell us how to reach you to arrange pickup.' },
    },
    'naloxone-form',
  );

  constructor() {
    this.impact.load();
    this.content.load();
    const form = this.f.form;
    // Chapter house and contact method are required only when they apply.
    form.get('requesting_for')!.valueChanges.subscribe((v) => this.requireIf('chapter_house', v === 'chapter_house'));
    form.get('pickup')!.valueChanges.subscribe((v) => this.requireIf('contact_method', v === 'arranged'));
  }

  isChecked(value: string): boolean {
    return (this.f.form.value.items ?? []).includes(value);
  }

  toggleItem(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ctl = this.f.form.get('items')!;
    const cur = (ctl.value as string[]) ?? [];
    ctl.setValue(checked ? [...cur, value] : cur.filter((v) => v !== value));
    ctl.markAsTouched();
  }

  submit(): void {
    this.f.submit((v) => this.api.requestNaloxone(v));
  }

  private requireIf(name: string, required: boolean): void {
    const c = this.f.form.get(name)!;
    c.setValidators(required ? [Validators.required, Validators.maxLength(name === 'chapter_house' ? 200 : 300)] : []);
    if (!required) c.setValue('');
    c.updateValueAndValidity();
  }
}
