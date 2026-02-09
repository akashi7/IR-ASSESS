import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CertificateService } from '../../services/certificate.service';

@Component({
  selector: 'app-certificate-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h1>Certificates</h1>
        <a routerLink="/certificates/generate" class="btn btn-primary">Generate Certificate</a>
      </div>

      <div *ngIf="loading" class="loading">Loading certificates...</div>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>

      <div *ngIf="!loading && certificates.length === 0" class="card">
        <p>No certificates found. Generate your first certificate to get started.</p>
      </div>

      <div *ngIf="!loading && certificates.length > 0" class="card">
        <table>
          <thead>
            <tr>
              <th>Certificate Number</th>
              <th>Template</th>
              <th>Status</th>
              <th>Issued At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cert of certificates">
              <td>{{ cert.certificateNumber }}</td>
              <td>{{ cert.template?.name || '-' }}</td>
              <td>{{ cert.status }}</td>
              <td>{{ cert.issuedAt | date:'short' }}</td>
              <td>
                <button class="btn btn-primary" (click)="downloadCertificate(cert.id)" style="margin-right: 5px;">Download</button>
                <button class="btn btn-danger" (click)="revokeCertificate(cert.id)" *ngIf="cert.status !== 'revoked'">Revoke</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CertificateListComponent implements OnInit {
  certificates: any[] = [];
  loading = true;
  error = '';

  constructor(private certificateService: CertificateService) {}

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.certificateService.getCertificates().subscribe({
      next: (response) => {
        this.certificates = response.certificates;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load certificates';
        this.loading = false;
      }
    });
  }

  downloadCertificate(id: string): void {
    this.certificateService.downloadCertificate(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificate.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error = 'Failed to download certificate';
      }
    });
  }

  revokeCertificate(id: string): void {
    if (confirm('Are you sure you want to revoke this certificate?')) {
      this.certificateService.revokeCertificate(id).subscribe({
        next: () => {
          this.loadCertificates();
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to revoke certificate';
        }
      });
    }
  }
}
