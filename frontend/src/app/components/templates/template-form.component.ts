import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Create Certificate Template</h1>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <div class="card">
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Template Name</label>
            <input type="text" class="form-control" [(ngModel)]="formData.name" name="name" required>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea class="form-control" [(ngModel)]="formData.description" name="description" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Certificate Title</label>
            <input type="text" class="form-control" [(ngModel)]="formData.title" name="title" required>
          </div>

          <h3>Fields</h3>
          <div *ngFor="let field of fields; let i = index" style="border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
            <div class="form-group">
              <label>Field Label</label>
              <input type="text" class="form-control" [(ngModel)]="field.label" [name]="'label' + i" required>
            </div>
            <div class="form-group">
              <label>Field Key (no spaces)</label>
              <input type="text" class="form-control" [(ngModel)]="field.key" [name]="'key' + i" required>
            </div>
            <button type="button" class="btn btn-danger" (click)="removeField(i)">Remove Field</button>
          </div>

          <button type="button" class="btn btn-secondary" (click)="addField()" style="margin-bottom: 20px;">Add Field</button>

          <div>
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              {{ loading ? 'Creating...' : 'Create Template' }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancel()" style="margin-left: 10px;">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TemplateFormComponent {
  formData = {
    name: '',
    description: '',
    title: 'Certificate of Achievement'
  };

  fields = [
    { key: 'recipientName', label: 'Recipient Name', type: 'text' },
    { key: 'completionDate', label: 'Completion Date', type: 'date' }
  ];

  error = '';
  success = '';
  loading = false;

  constructor(private templateService: TemplateService, private router: Router) {}

  addField(): void {
    this.fields.push({ key: '', label: '', type: 'text' });
  }

  removeField(index: number): void {
    this.fields.splice(index, 1);
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    const templateData = {
      name: this.formData.name,
      description: this.formData.description,
      content: {
        title: this.formData.title,
        fields: this.fields,
        layout: {
          orientation: 'landscape',
          fontSize: 12
        }
      },
      placeholders: this.fields.map(f => f.key)
    };

    this.templateService.createTemplate(templateData).subscribe({
      next: () => {
        this.success = 'Template created successfully!';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/templates']), 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to create template';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/templates']);
  }
}
