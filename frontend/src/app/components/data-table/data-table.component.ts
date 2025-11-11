import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../services/transaction.service';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = false;
  selectedFile: File | null = null;

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
    if (confirm('¿Eliminar esta transaccion?')) {
      this.transactionService.delete(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
        }
      });
    }
  }

  downloadCSV() {
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
      },
      error: (error) => {
        console.error('Error downloading CSV:', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
    } else {
      alert('Por favor selecciona un archivo CSV');
      event.target.value = '';
    }
  }

  uploadCSV() {
    if (!this.selectedFile) {
      alert('Selecciona un archivo CSV primero');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isLoading = true;
    this.transactionService.importCsv(formData).subscribe({
      next: () => {
        alert('CSV importado exitosamente');
        this.selectedFile = null;
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error uploading CSV:', error);
        alert('Error al importar CSV');
        this.isLoading = false;
      }
    });
  }
}


