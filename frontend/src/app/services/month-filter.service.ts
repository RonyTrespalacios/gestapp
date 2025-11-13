import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonthFilterService {
  private selectedMonthSubject = new BehaviorSubject<string>('all');
  public selectedMonth$: Observable<string> = this.selectedMonthSubject.asObservable();

  setSelectedMonth(month: string) {
    this.selectedMonthSubject.next(month);
  }

  getSelectedMonth(): string {
    return this.selectedMonthSubject.value;
  }
}

