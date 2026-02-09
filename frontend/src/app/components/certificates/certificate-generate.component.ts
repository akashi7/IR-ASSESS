import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TemplateService } from '../../services/template.service';
import { CertificateService } from '../../services/certificate.service';

@Component({
  selector: 'app-certificate-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Generate Certificate</h1>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <div class="card">
        <form (ngSubmit)="onGenerate()">
          <div class="form-group">
            <label>Select Template</label>
            <select class="form-control" [(ngModel)]="selectedTemplateId" name="template" (change)="onTemplateChange()" required>
              <option value="">-- Select a template --</option>
              <option *ngFor="let template of templates" [value]="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>

          <div *ngIf="selectedTemplate">
            <h3>Certificate Data</h3>
            <div *ngFor="let field of selectedTemplate.content.fields" class="form-group">
              <label>{{ field.label }}</label>
              <input
                [type]="field.type === 'date' ? 'date' : 'text'"
                class="form-control"
                [(ngModel)]="certificateData[field.key]"
                [name]="field.key"
                required>
            </div>

            <button type="button" class="btn btn-secondary" (click)="onSimulate()" [disabled]="loading" style="margin-right: 10px;">
              {{ loading ? 'Simulating...' : 'Simulate' }}
            </button>

            <button type="submit" class="btn btn-primary" [disabled]="loading">
              {{ loading ? 'Generating...' : 'Generate Certificate' }}
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="preview" class="card" style="margin-top: 20px;">
        <h3>Certificate Preview</h3>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 4px;">
          <h2 style="text-align: center;">{{ preview.estimatedOutput.title }}</h2>
          <div *ngFor="let field of preview.estimatedOutput.fields" style="margin: 10px 0;">
            <strong>{{ field.label }}:</strong> {{ field.value }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class CertificateGenerateComponent implements OnInit {
  templates: any[] = [];
  selectedTemplateId = '';
  selectedTemplate: any = null;
  certificateData: any = {};
  preview: any = null;
  error = '';
  success = '';
  loading = false;

  constructor(
    private templateService: TemplateService,
    private certificateService: CertificateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.templateService.getTemplates().subscribe({
      next: (response) => {
        this.templates = response.templates;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load templates';
      }
    });
  }

  onTemplateChange(): void {
    this.selectedTemplate = this.templates.find(t => t.id === this.selectedTemplateId);
    this.certificateData = {};
    this.preview = null;
    this.error = '';
  }

  onSimulate(): void {
    this.error = '';
    this.loading = true;

    this.certificateService.simulateCertificate({
      templateId: this.selectedTemplateId,
      data: this.certificateData
    }).subscribe({
      next: (response) => {
        this.preview = response.preview;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to simulate certificate';
        this.loading = false;
      }
    });
  }

  onGenerate(): void {
    this.error = '';
    this.success = '';
    this.loading = true;

    // Generate and save the certificate
    this.certificateService.generateCertificate({
      templateId: this.selectedTemplateId,
      data: this.certificateData
    }).subscribe({
      next: (response) => {
        this.success = 'Certificate generated successfully!';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/certificates']), 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to generate certificate';
        this.loading = false;
      }
    });
  }
}
