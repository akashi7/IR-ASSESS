import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = `${environment.apiUrl}/templates`;

  constructor(private http: HttpClient) {}

  getTemplates(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getTemplate(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createTemplate(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateTemplate(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
