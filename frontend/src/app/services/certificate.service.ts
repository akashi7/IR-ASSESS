import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  getCertificates(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  getCertificate(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  simulateCertificate(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/simulate`, data);
  }

  generateCertificate(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-ui`, data);
  }

  downloadCertificate(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  verifyCertificate(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify/${token}`);
  }

  revokeCertificate(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/revoke`, {});
  }
}
