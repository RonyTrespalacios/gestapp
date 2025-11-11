import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = false;
  selectedFile: File | null = null;
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';
  showConfirmModal = false;
  pendingDeleteId: number | null = null;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.isLoading = true;
    this.transactionService.getAll().subscribe({
      next: (data) => {
        this.transactions = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  deleteTransaction(id: number) {
    this.pendingDeleteId = id;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (this.pendingDeleteId === null) return;

    this.transactionService.delete(this.pendingDeleteId).subscribe({
      next: () => {
        this.showModalMessage('Éxito', 'Transacción eliminada exitosamente', 'success');
        this.loadTransactions();
        this.pendingDeleteId = null;
      },
      error: (error) => {
        console.error('Error deleting transaction:', error);
        this.showModalMessage('Error', 'Error al eliminar la transacción', 'error');
        this.pendingDeleteId = null;
      }
    });
    this.showConfirmModal = false;
  }

  cancelDelete() {
    this.showConfirmModal = false;
    this.pendingDeleteId = null;
  }

  downloadCSV() {
    if (this.transactions.length === 0) {
      this.showModalMessage('Advertencia', 'No hay datos para exportar', 'info');
      return;
    }

    this.transactionService.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestapp_backup_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.showModalMessage('Éxito', 'CSV descargado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error downloading CSV:', error);
        this.showModalMessage('Error', 'Error al descargar el CSV', 'error');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
    } else {
      this.showModalMessage('Advertencia', 'Por favor selecciona un archivo CSV válido', 'error');
      event.target.value = '';
    }
  }

  uploadCSV() {
    if (!this.selectedFile) {
      this.showModalMessage('Advertencia', 'Selecciona un archivo CSV primero', 'info');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isLoading = true;
    this.transactionService.importCsv(formData).subscribe({
      next: () => {
        this.showModalMessage('Éxito', 'CSV importado exitosamente', 'success');
        this.selectedFile = null;
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error uploading CSV:', error);
        this.showModalMessage('Error', 'Error al importar CSV', 'error');
        this.isLoading = false;
      }
    });
  }

  showModalMessage(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}


