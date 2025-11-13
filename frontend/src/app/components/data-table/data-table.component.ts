import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../services/transaction.service';
import * as XLSX from 'xlsx';
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
  exportFormat: 'csv' | 'xlsx' = 'csv';
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';
  showConfirmModal = false;
  pendingDeleteId: number | null = null;
  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

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

  downloadData() {
    if (this.transactions.length === 0) {
      this.showModalMessage('Advertencia', 'No hay datos para exportar', 'info');
      return;
    }

    this.transactionService.exportCsv().subscribe({
      next: async (blob) => {
        try {
          if (this.exportFormat === 'csv') {
            this.triggerDownload(blob, `gestapp_${this.today()}.csv`);
          } else {
            // Convertir CSV -> XLSX en cliente
            const csvText = await blob.text();
            const wb = XLSX.read(csvText, { type: 'string' });
            // Si no hubieran hojas, crear una
            if (!wb.SheetNames.length) {
              const ws = XLSX.utils.aoa_to_sheet([]);
              XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            }
            const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const xlsxBlob = new Blob([xlsxArray], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            this.triggerDownload(xlsxBlob, `gestapp_${this.today()}.xlsx`);
          }
          this.showModalMessage('Éxito', 'Descarga generada correctamente', 'success');
        } catch (e) {
          console.error('Error convirtiendo a XLSX:', e);
          this.showModalMessage('Error', 'No se pudo generar el archivo XLSX', 'error');
        }
      },
      error: (error) => {
        console.error('Error downloading CSV:', error);
        this.showModalMessage('Error', 'Error al descargar el CSV', 'error');
      }
    });
  }

  private triggerDownload(fileBlob: Blob, filename: string) {
    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.xlsx')) {
      this.selectedFile = file;
    } else {
      this.showModalMessage('Advertencia', 'Selecciona un archivo .csv o .xlsx', 'error');
      event.target.value = '';
    }
  }

  uploadCSV() {
    if (!this.selectedFile) {
      this.showModalMessage('Advertencia', 'Selecciona un archivo CSV primero', 'info');
      return;
    }

    const name = (this.selectedFile.name || '').toLowerCase();

    const processAndUpload = (csvBlob: Blob) => {
      const formData = new FormData();
      formData.append('file', new File([csvBlob], 'import.csv', { type: 'text/csv' }));
      this.isLoading = true;
      this.transactionService.importCsv(formData).subscribe({
        next: () => {
          this.showModalMessage('Éxito', 'Archivo importado exitosamente', 'success');
          this.selectedFile = null;
          this.loadTransactions();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error uploading CSV:', error);
          const details = error?.error?.details;
          let message =
            error?.error?.message ??
            'Error al importar. Verifica el formato del archivo e inténtalo nuevamente.';

          if (Array.isArray(details) && details.length > 0) {
            message += `\n\nDetalles:\n- ${details.join('\n- ')}`;
          }
          this.showModalMessage('Error', message, 'error');
          this.isLoading = false;
        }
      });
    };

    // Si es xlsx, convertir a CSV cliente-side
    if (name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheet = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheet];
          const csv = XLSX.utils.sheet_to_csv(ws);
          processAndUpload(new Blob([csv], { type: 'text/csv' }));
        } catch (e) {
          console.error('Error convirtiendo XLSX a CSV:', e);
          this.showModalMessage('Error', 'No se pudo convertir el XLSX a CSV', 'error');
        }
      };
      reader.readAsArrayBuffer(this.selectedFile);
    } else {
      // CSV directo
      processAndUpload(this.selectedFile);
    }
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

  formatAmount(amount: number | null | undefined): string {
    const numericValue = typeof amount === 'string' ? Number(amount) : amount;

    if (!Number.isFinite(numericValue ?? NaN)) {
      return '$ --';
    }

    return `$ ${this.numberFormatter.format(numericValue as number)}`;
  }
}


