import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { AuthService } from '../../services/auth.service';
import { AiChatWidgetComponent } from '../ai-chat-widget/ai-chat-widget.component';

@Component({
  selector: 'app-transaction-form-manual',
  standalone: true,
  imports: [CommonModule, TransactionFormComponent, AiChatWidgetComponent],
  template: `
    <!-- AI Chat Widget (solo si está autenticado) -->
    <app-ai-chat-widget *ngIf="authService.isAuthenticated"></app-ai-chat-widget>
    <app-transaction-form [forceManualMode]="true"></app-transaction-form>
  `
})
export class TransactionFormManualComponent {
  constructor(public authService: AuthService) {}
}

