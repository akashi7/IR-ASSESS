import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div>
      <nav class="navbar">
        <div class="container">
          <div>
            <a routerLink="/">Certificate Management</a>
            <a *ngIf="isLoggedIn" routerLink="/dashboard">Dashboard</a>
            <a *ngIf="isLoggedIn" routerLink="/templates">Templates</a>
            <a *ngIf="isLoggedIn" routerLink="/certificates">Certificates</a>
          </div>
          <div>
            <a *ngIf="!isLoggedIn" routerLink="/login">Login</a>
            <a *ngIf="!isLoggedIn" routerLink="/register">Register</a>
            <a *ngIf="isLoggedIn" (click)="logout()" style="cursor: pointer;">Logout</a>
          </div>
        </div>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class AppComponent {
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
