import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetroButtonComponent } from '../retro-button/retro-button.component';

type ModalType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, RetroButtonComponent],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() type: ModalType = 'info';
  @Input() show: boolean = false;
  @Input() showConfirmButtons: boolean = false;
  @Input() confirmLabel: string = 'Confirmar';
  @Input() cancelLabel: string = 'Cancelar';
  @Input() confirmDisabled: boolean = false;
  @Input() closeOnOverlayClick: boolean = true;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  get confirmButtonVariant(): 'danger' | 'confirm' {
    return this.type === 'error' ? 'danger' : 'confirm';
  }

  closeModal(): void {
    this.close.emit();
  }

  confirmAction(): void {
    if (this.confirmDisabled) {
      return;
    }
    this.confirm.emit();
  }

  onOverlayClick(): void {
    if (this.closeOnOverlayClick) {
      this.closeModal();
    }
  }
}

