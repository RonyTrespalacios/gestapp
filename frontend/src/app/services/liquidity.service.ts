import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LiquidityBalance {
  id?: number;
  medio: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiquidityHistory {
  id: number;
  medio: string;
  balance: number;
  createdAt: string;
}

export interface UpdateBalanceRequest {
  medio: string;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class LiquidityService {
  private apiUrl = `${environment.apiUrl}/liquidity`;

  constructor(private http: HttpClient) {}

  getBalances(): Observable<LiquidityBalance[]> {
    return this.http.get<LiquidityBalance[]>(`${this.apiUrl}/balances`);
  }

  getTotalLiquidity(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/total`);
  }

  updateBalance(update: UpdateBalanceRequest): Observable<LiquidityBalance> {
    return this.http.post<LiquidityBalance>(`${this.apiUrl}/update`, update);
  }

  getHistory(date?: string): Observable<LiquidityHistory[]> {
    if (date) {
      return this.http.get<LiquidityHistory[]>(`${this.apiUrl}/history`, { params: { date } });
    }
    return this.http.get<LiquidityHistory[]>(`${this.apiUrl}/history`);
  }
}

