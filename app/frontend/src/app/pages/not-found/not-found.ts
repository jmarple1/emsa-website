import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div class="wrap">
        <h1>Page not found</h1>
        <p class="lead">This page doesn't exist. It may have moved.</p>
        <p class="btn-row"><a class="btn btn-primary" routerLink="/">Go to the home page</a></p>
      </div>
    </div>
  `,
})
export class NotFound {}
