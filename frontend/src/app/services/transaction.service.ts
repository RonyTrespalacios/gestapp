import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Transaction {
  id?: number;
  categoria: string;
  descripcion: string;
  tipo: string;
  monto: number;
  medio: string;
  fecha: string;
  observaciones?: string;
  valor?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  create(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  getAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  getOne(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  update(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}`, transaction);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, {
      responseType: 'blob'
    });
  }

  importCsv(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/import/csv`, formData);
  }
}
