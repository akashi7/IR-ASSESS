import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h1>Certificate Templates</h1>
        <a routerLink="/templates/create" class="btn btn-primary">Create Template</a>
      </div>

      <div *ngIf="loading" class="loading">Loading templates...</div>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>

      <div *ngIf="!loading && templates.length === 0" class="card">
        <p>No templates found. Create your first template to get started.</p>
      </div>

      <div *ngIf="!loading && templates.length > 0" class="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Placeholders</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let template of templates">
              <td>{{ template.name }}</td>
              <td>{{ template.description || '-' }}</td>
              <td>{{ template.placeholders.join(', ') }}</td>
              <td>{{ template.isActive ? 'Active' : 'Inactive' }}</td>
              <td>
                <button class="btn btn-danger" (click)="deleteTemplate(template.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TemplateListComponent implements OnInit {
  templates: any[] = [];
  loading = true;
  error = '';

  constructor(private templateService: TemplateService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.templateService.getTemplates().subscribe({
      next: (response) => {
        this.templates = response.templates;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load templates';
        this.loading = false;
      }
    });
  }

  deleteTemplate(id: string): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.templateService.deleteTemplate(id).subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to delete template';
        }
      });
    }
  }
}
