import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../services/transaction.service';
import * as XLSX from 'xlsx';
import { ModalComponent } from '../modal/modal.component';
import { FileUploadModalComponent } from '../file-upload-modal/file-upload-modal.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, FileUploadModalComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('container', { static: false }) containerRef?: ElementRef;
  
  transactions: Transaction[] = [];
  allTransactions: Transaction[] = []; // Todas las transacciones cargadas
  displayedTransactions: Transaction[] = []; // Transacciones mostradas según el límite
  displayLimit: number = 10; // Límite por defecto
  private readonly DISPLAY_LIMIT_KEY = 'gestapp_display_limit'; // Clave para localStorage
  isLoading = false;
  selectedFile: File | null = null;
  exportFormat: 'csv' | 'xlsx' = 'csv';
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';
  showConfirmModal = false;
  pendingDeleteId: number | null = null;
  showUploadModal = false;
  pendingFile: File | null = null;
  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  private dragOverCounter = 0;
  private dragEnterHandler?: (e: DragEvent) => void;
  private dragOverHandler?: (e: DragEvent) => void;
  private dragLeaveHandler?: (e: DragEvent) => void;
  private dropHandler?: (e: DragEvent) => void;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    // Cargar la configuración guardada del usuario
    this.loadDisplayLimitFromStorage();
    this.loadTransactions();
  }

  private loadDisplayLimitFromStorage() {
    const saved = localStorage.getItem(this.DISPLAY_LIMIT_KEY);
    if (saved) {
      const limit = parseInt(saved, 10);
      if (!isNaN(limit) && (limit === -1 || limit > 0)) {
        this.displayLimit = limit;
      }
    }
  }

  private saveDisplayLimitToStorage() {
    localStorage.setItem(this.DISPLAY_LIMIT_KEY, this.displayLimit.toString());
  }

  ngAfterViewInit() {
    // Esperar un tick para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.setupDragAndDrop();
    }, 0);
  }

  ngOnDestroy() {
    this.removeDragAndDropListeners();
  }

  private setupDragAndDrop() {
    // Usar listeners a nivel de documento para capturar drag desde fuera
    this.dragEnterHandler = (e: DragEvent) => {
      // Verificar que sea un archivo y no esté sobre el modal
      const target = e.target as HTMLElement;
      if (target?.closest('.modal-overlay') || target?.closest('app-file-upload-modal')) {
        return; // No hacer nada si está sobre el modal
      }

      // Verificar que el evento esté dentro del contenedor de datos
      const container = this.containerRef?.nativeElement || document.querySelector('.data-table-container');
      if (!container) {
        return;
      }
      
      // Verificar que el target esté dentro del contenedor o sea el contenedor mismo
      // Si target es null o body, también permitir (drag desde fuera de la página)
      const isInsideContainer = !target || target === container || container.contains(target);
      if (!isInsideContainer) {
        return; // Solo procesar si está dentro del contenedor o viene desde fuera
      }

      e.preventDefault();
      e.stopPropagation();
      this.dragOverCounter++;
      
      // Solo abrir el modal si no está ya abierto y si hay archivos
      if (this.dragOverCounter === 1 && !this.showUploadModal) {
        const types = e.dataTransfer?.types || [];
        const hasFiles = types.includes('Files') || 
                        Array.from(types).some(t => t === 'application/x-moz-file' || t.includes('file'));
        
        if (hasFiles) {
          const items = e.dataTransfer?.items;
          let isFile = false;
          
          if (items && items.length > 0) {
            // Verificar que al menos uno sea un archivo
            for (let i = 0; i < items.length; i++) {
              if (items[i].kind === 'file') {
                isFile = true;
                break;
              }
            }
          } else if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            // Fallback: si hay archivos pero no items, considerar como archivo
            isFile = true;
          }
          
          if (isFile) {
            this.openUploadModal();
          }
        }
      }
    };

    this.dragOverHandler = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.modal-overlay') || target?.closest('app-file-upload-modal')) {
        return;
      }
      
      const container = this.containerRef?.nativeElement || document.querySelector('.data-table-container');
      if (!container) {
        return;
      }
      
      if (target && target !== container && !container.contains(target)) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
    };

    this.dragLeaveHandler = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.modal-overlay') || target?.closest('app-file-upload-modal')) {
        return;
      }
      
      const container = this.containerRef?.nativeElement || document.querySelector('.data-table-container');
      if (!container) {
        return;
      }
      
      if (target && target !== container && !container.contains(target)) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      this.dragOverCounter--;
      if (this.dragOverCounter <= 0) {
        this.dragOverCounter = 0;
      }
    };

    this.dropHandler = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.modal-overlay') || target?.closest('app-file-upload-modal')) {
        return; // Dejar que el modal maneje el drop
      }

      const container = this.containerRef?.nativeElement || document.querySelector('.data-table-container');
      if (!container) {
        return;
      }
      
      if (target && target !== container && !container.contains(target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      this.dragOverCounter = 0;
      
      // Si hay archivos y el modal no está abierto, guardar el archivo y abrir el modal
      if (!this.showUploadModal && e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const name = (file.name || '').toLowerCase();
        if (name.endsWith('.csv') || name.endsWith('.xlsx')) {
          this.pendingFile = file;
          this.openUploadModal();
        }
      }
    };

    // Agregar listeners a nivel de documento para capturar drag desde fuera
    document.addEventListener('dragenter', this.dragEnterHandler, false);
    document.addEventListener('dragover', this.dragOverHandler, false);
    document.addEventListener('dragleave', this.dragLeaveHandler, false);
    document.addEventListener('drop', this.dropHandler, false);
  }

  private removeDragAndDropListeners() {
    // Remover listeners a nivel de documento
    if (this.dragEnterHandler) {
      document.removeEventListener('dragenter', this.dragEnterHandler, false);
    }
    if (this.dragOverHandler) {
      document.removeEventListener('dragover', this.dragOverHandler, false);
    }
    if (this.dragLeaveHandler) {
      document.removeEventListener('dragleave', this.dragLeaveHandler, false);
    }
    if (this.dropHandler) {
      document.removeEventListener('drop', this.dropHandler, false);
    }
  }

  loadTransactions() {
    this.isLoading = true;
    this.transactionService.getAll().subscribe({
      next: (data) => {
        // Guardar todas las transacciones
        this.allTransactions = data;
        // Aplicar el límite de visualización
        this.applyDisplayLimit();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  applyDisplayLimit() {
    // Ordenar por fecha DESC y luego por createdAt DESC o ID DESC para asegurar orden correcto
    const sorted = [...this.allTransactions].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      
      // Si las fechas son diferentes, ordenar por fecha
      if (dateA !== dateB) {
        return dateB - dateA; // Más reciente primero
      }
      
      // Si las fechas son iguales, ordenar por createdAt (más reciente primero)
      if (a.createdAt && b.createdAt) {
        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        if (createdA !== createdB) {
          return createdB - createdA;
        }
      }
      
      // Si no hay createdAt o son iguales, usar ID como respaldo (mayor ID = más reciente)
      if (a.id && b.id) {
        return (b.id || 0) - (a.id || 0);
      }
      
      // Si no hay ID, mantener el orden original
      return 0;
    });

    // Aplicar el límite (si es -1, mostrar todas)
    if (this.displayLimit === -1 || this.displayLimit < 0) {
      // Mostrar todas las transacciones
      this.displayedTransactions = sorted;
      this.transactions = sorted;
    } else {
      // Mostrar solo las primeras X transacciones
      this.displayedTransactions = sorted.slice(0, this.displayLimit);
      this.transactions = this.displayedTransactions;
    }
  }

  get hasMoreTransactions(): boolean {
    return this.displayLimit !== -1 && this.allTransactions.length > this.displayLimit;
  }

  get remainingCount(): number {
    return this.allTransactions.length - this.displayLimit;
  }

  onDisplayLimitChange() {
    // Asegurar que el valor sea numérico
    if (typeof this.displayLimit === 'string') {
      this.displayLimit = parseInt(this.displayLimit, 10);
    }
    this.applyDisplayLimit();
    this.saveDisplayLimitToStorage();
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
        // Recargar todas las transacciones y aplicar el límite
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

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.pendingFile = null;
  }

  onFileSelectedFromModal(file: File) {
    this.selectedFile = file;
    this.pendingFile = null; // Limpiar el archivo pendiente
    this.showUploadModal = false; // Cerrar el modal
    this.uploadCSV(); // Iniciar la carga automáticamente
  }


  uploadCSV() {
    if (!this.selectedFile) {
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
          this.pendingFile = null;
          this.loadTransactions();
          this.isLoading = false;
          this.showUploadModal = false;
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
          // No cerrar el modal en caso de error para que el usuario pueda intentar de nuevo
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
          
          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            this.showModalMessage('Error', 'El archivo XLSX no contiene hojas de cálculo', 'error');
            return;
          }
          
          const firstSheet = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheet];
          
          if (!ws) {
            this.showModalMessage('Error', 'No se pudo leer la hoja de cálculo del archivo XLSX', 'error');
            return;
          }
          
          const csv = XLSX.utils.sheet_to_csv(ws);
          
          if (!csv || csv.trim().length === 0) {
            this.showModalMessage('Error', 'El archivo XLSX está vacío', 'error');
            return;
          }
          
          processAndUpload(new Blob([csv], { type: 'text/csv' }));
        } catch (e) {
          console.error('Error convirtiendo XLSX a CSV:', e);
          this.showModalMessage('Error', 'No se pudo convertir el archivo XLSX. Verifica que el archivo no esté corrupto.', 'error');
        }
      };
      reader.onerror = () => {
        this.showModalMessage('Error', 'Error al leer el archivo XLSX', 'error');
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

  /**
   * Calcula el flujo de caja sumando todos los valores de las transacciones
   * Los valores ya tienen en cuenta si es ingreso (positivo) o egreso (negativo)
   */
  get cashFlow(): number {
    if (!this.allTransactions || this.allTransactions.length === 0) {
      return 0;
    }
    
    return this.allTransactions.reduce((sum, transaction) => {
      const valor = typeof transaction.valor === 'string' 
        ? Number(transaction.valor) 
        : transaction.valor ?? 0;
      
      if (Number.isFinite(valor) && valor !== undefined && valor !== null) {
        return sum + valor;
      }
      return sum;
    }, 0);
  }

  /**
   * Formatea el flujo de caja con el signo apropiado
   */
  get formattedCashFlow(): string {
    const flow = this.cashFlow;
    const formatted = this.formatAmount(Math.abs(flow));
    return flow >= 0 ? `+${formatted}` : `-${formatted}`;
  }
}


