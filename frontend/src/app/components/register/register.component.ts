import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card" style="max-width: 600px; margin: 50px auto;">
        <h2>Register</h2>
        <div *ngIf="error" class="alert alert-error">{{ error }}</div>
        <div *ngIf="success" class="alert alert-success" style="word-wrap: break-word;">
          <h3 style="margin-bottom: 16px;">{{ success }}</h3>

          <div style="background: #fff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 2px solid #4CAF50;">
            <p style="margin: 8px 0; font-weight: bold; color: #333;">API Key:</p>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 13px; word-break: break-all; color: #333;">
              {{ apiKey }}
            </div>
          </div>

          <div style="background: #fff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 2px solid #FF9800;">
            <p style="margin: 8px 0; font-weight: bold; color: #333;">API Secret:</p>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 13px; word-break: break-all; color: #333;">
              {{ apiSecret }}
            </div>
          </div>

          <div class="alert alert-info" style="margin-top: 16px;">
            <strong>⚠️ Important:</strong> Please save these credentials now. You won't be able to see the API Secret again!
          </div>
        </div>
        <form (ngSubmit)="onSubmit()" *ngIf="!success">
          <div class="form-group">
            <label>Company Name</label>
            <input type="text" class="form-control" [(ngModel)]="formData.companyName" name="companyName" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" [(ngModel)]="formData.email" name="email" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="form-control" [(ngModel)]="formData.password" name="password" required>
          </div>
          <div class="form-group">
            <label>Contact Person</label>
            <input type="text" class="form-control" [(ngModel)]="formData.contactPerson" name="contactPerson">
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="text" class="form-control" [(ngModel)]="formData.phone" name="phone">
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Register' }}
          </button>
          <p style="margin-top: 16px;">
            Already have an account? <a routerLink="/login">Login here</a>
          </p>
        </form>
        <button *ngIf="success" class="btn btn-primary" (click)="goToLogin()">Go to Login</button>
      </div>
    </div>
  `
})
export class RegisterComponent {
  formData = {
    companyName: '',
    email: '',
    password: '',
    contactPerson: '',
    phone: ''
  };
  error = '';
  success = '';
  apiKey = '';
  apiSecret = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.authService.register(this.formData).subscribe({
      next: (response) => {
        this.success = 'Registration successful!';
        this.apiKey = response.customer.apiKey;
        this.apiSecret = response.customer.apiSecret;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed';
        this.loading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
