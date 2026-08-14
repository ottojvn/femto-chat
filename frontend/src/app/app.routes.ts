import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'chat',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login)
    },
    {
        path: 'signup',
        loadComponent: () => import('./features/auth/pages/signup/signup').then(m => m.Signup)
    },
    {
        path: 'chat',
        loadComponent: () => import('./features/chat/pages/chat/chat').then(m => m.Chat),
        canActivate: [authGuard]
    },
];
