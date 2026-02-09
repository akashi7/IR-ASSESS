import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'templates',
    loadComponent: () => import('./components/templates/template-list.component').then(m => m.TemplateListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'templates/create',
    loadComponent: () => import('./components/templates/template-form.component').then(m => m.TemplateFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'certificates',
    loadComponent: () => import('./components/certificates/certificate-list.component').then(m => m.CertificateListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'certificates/generate',
    loadComponent: () => import('./components/certificates/certificate-generate.component').then(m => m.CertificateGenerateComponent),
    canActivate: [authGuard]
  }
];
