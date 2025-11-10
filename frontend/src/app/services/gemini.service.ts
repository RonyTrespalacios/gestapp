import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = `${environment.apiUrl}/gemini`;

  constructor(private http: HttpClient) {}

  parseTransaction(userInput: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/parse`, { userInput });
  }
}
