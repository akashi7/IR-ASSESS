import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <h1 style="margin-bottom: 24px; color: #333;">Dashboard</h1>

      <div *ngIf="customer" class="card" style="margin-bottom: 32px; padding: 24px;">
        <h2 style="margin: 0 0 16px 0; color: #4CAF50; font-size: 24px;">Welcome, {{ customer.companyName }}!</h2>
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="min-width: 80px; color: #666;">Email:</strong>
            <span style="color: #333;">{{ customer.email }}</span>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <strong style="min-width: 80px; color: #666; padding-top: 2px;">API Key:</strong>
            <code style="background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-size: 13px; word-break: break-all; flex: 1; color: #333; font-family: monospace;">{{ customer.apiKey }}</code>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
        <div class="card" style="padding: 24px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e0e0e0;">
          <h3 style="margin: 0 0 12px 0; color: #2196F3; font-size: 20px;">📋 Templates</h3>
          <p style="color: #666; margin-bottom: 20px; min-height: 48px;">Create and manage certificate templates</p>
          <a routerLink="/templates" class="btn btn-primary" style="width: 100%;">View Templates</a>
        </div>

        <div class="card" style="padding: 24px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e0e0e0;">
          <h3 style="margin: 0 0 12px 0; color: #FF9800; font-size: 20px;">🎓 Certificates</h3>
          <p style="color: #666; margin-bottom: 20px; min-height: 48px;">View and manage generated certificates</p>
          <a routerLink="/certificates" class="btn btn-primary" style="width: 100%;">View Certificates</a>
        </div>

        <div class="card" style="padding: 24px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e0e0e0;">
          <h3 style="margin: 0 0 12px 0; color: #4CAF50; font-size: 20px;">✨ Generate</h3>
          <p style="color: #666; margin-bottom: 20px; min-height: 48px;">Generate new certificates from templates</p>
          <a routerLink="/certificates/generate" class="btn btn-primary" style="width: 100%;">Generate Now</a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  customer: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.customer = response.customer;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }
}
