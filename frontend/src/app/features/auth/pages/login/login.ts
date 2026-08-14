import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  formBuilder = inject(FormBuilder);
  authService = inject(Auth);
  router = inject(Router);

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    console.log("OnSubmit called");
    console.log("Validation status:", this.loginForm.valid);
    console.log("Form values:", this.loginForm.value);
    if (!this.loginForm.valid) {
      console.log("Form is invalid");
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return;
    }

    const credentials = { email, password };
    console.log("Credentials:", JSON.stringify(credentials));

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        console.error('Login failed', err);
      },
    });
  }
}
