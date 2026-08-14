import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  formBuilder = inject(FormBuilder);
  authService = inject(Auth);
  router = inject(Router);

  signupForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  onSubmit(): void {
    console.log("OnSubmit called");
    console.log("Validation status:", this.signupForm.valid);
    console.log("Form values:", this.signupForm.value);

    if (!this.signupForm.valid) {
      console.log("Form is invalid");
      this.signupForm.markAllAsTouched();
      return;
    }

    const name = this.signupForm.get('name')?.value;
    const email = this.signupForm.get('email')?.value;
    const password = this.signupForm.get('password')?.value;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return;
    }

    const credentials = { name, email, password };

    this.authService.signup(credentials).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        console.error('Signup failed', err);
      },
    });
  }
}
