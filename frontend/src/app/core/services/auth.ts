import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { User } from '../models/user';
import { LoginCredentials } from '../models/login-credentials';
import { AuthResponse } from '../models/auth-response';

import { environment } from '../../../environments/environment';
import { SignupCredentials } from '../models/signup-credentials';
import { Observable, switchMap, tap } from 'rxjs';

@Service()
export class Auth {
    private http = inject(HttpClient);
    currentUser = signal<User | null>(this.getUserFromToken());

    login(credentials: LoginCredentials): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
            tap((response) => {
                localStorage.setItem('access_token', response.access_token);
                this.currentUser.set(this.getUserFromToken());
            })
        );
    }

    signup(credentials: SignupCredentials): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/users`, credentials).pipe(
           switchMap(() => this.login({ email: credentials.email, password: credentials.password }))
        );
    }

    logout(): void {
        localStorage.removeItem('access_token');
        this.currentUser.set(null);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    private getUserFromToken(): User | null {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                createdAt: new Date().toISOString(),
            };
        } catch (error) {
            return null;
        }

    }
}
