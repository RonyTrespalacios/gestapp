import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { RetroButtonComponent } from '../retro-button/retro-button.component';
import { TransactionService } from '../../services/transaction.service';

type ModalType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, RetroButtonComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  confirmationInput = '';
  isProcessing = false;

  confirmDeletionModal = {
    show: false,
    title: 'Confirmar eliminación',
    message:
      'Esta acción eliminará para siempre todos tus registros financieros. Esta operación no se puede deshacer. ¿Deseas continuar?'
  };

  verifyDeletionModal = {
    show: false,
    title: 'Verificación de seguridad',
    message: ''
  };

  feedbackModal: { show: boolean; title: string; message: string; type: ModalType } = {
    show: false,
    title: '',
    message: '',
    type: 'info'
  };

  constructor(private readonly transactionService: TransactionService) {}

  startDeletionFlow(): void {
    this.confirmDeletionModal.show = true;
  }

  proceedToVerification(): void {
    this.confirmDeletionModal.show = false;
    this.verifyDeletionModal.show = true;
    this.confirmationInput = '';
  }

  cancelDeletionFlow(): void {
    this.confirmDeletionModal.show = false;
    this.verifyDeletionModal.show = false;
    this.isProcessing = false;
    this.confirmationInput = '';
  }

  get isConfirmationValid(): boolean {
    return this.confirmationInput.trim().toUpperCase() === 'ELIMINAR';
  }

  executeDeletion(): void {
    if (!this.isConfirmationValid || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    this.transactionService.deleteAllForCurrentUser().subscribe({
      next: (result) => {
        this.isProcessing = false;
        this.verifyDeletionModal.show = false;
        const type: ModalType = result.deleted > 0 ? 'success' : 'info';
        this.showFeedbackModal(
          'Datos eliminados',
          result.deleted > 0
            ? `Se eliminaron ${result.deleted} ${result.deleted === 1 ? 'registro' : 'registros'} de forma permanente.`
            : 'No se encontraron registros para eliminar.',
          type
        );
        this.confirmationInput = '';
      },
      error: (error) => {
        console.error('Error deleting transactions for current user', error);
        this.isProcessing = false;
        this.showFeedbackModal(
          'Error al eliminar datos',
          error?.error?.message ??
            'Ocurrió un error al eliminar tus datos. Intenta nuevamente o contacta soporte si el problema persiste.',
          'error'
        );
      }
    });
  }

  closeFeedbackModal(): void {
    this.feedbackModal.show = false;
  }

  private showFeedbackModal(title: string, message: string, type: ModalType): void {
    this.feedbackModal = { show: true, title, message, type };
  }
}

