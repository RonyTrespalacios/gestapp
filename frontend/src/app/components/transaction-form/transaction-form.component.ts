import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit {
  transaction: Transaction = {
    categoria: '',
    descripcion: '',
    tipo: '',
    monto: 0,
    medio: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  };

  categorias = ['Necesidad', 'Lujo', 'Ahorro', 'Entrada'];
  tipos = ['Ingreso', 'Egreso', 'Ahorro'];
  medios = ['Efectivo', 'NU', 'Daviplata', 'Nequi', 'BBVA', 'Bancolombia', 'Davivienda', 'Otro'];
  
  descripciones: { [key: string]: string[] } = {
    'Necesidad': ['Alimentacion necesaria', 'Aseo (casa o personal)', 'Medicina', 'Vivienda', 'Pago de servicios', 'Transporte', 'No alimentarios', 'Impuesto', 'Cargos / tarifas', 'Ropa', 'Gasolina', 'Dinero a mi madre', 'Trabajo', 'Parqueadero', 'Peluqueada', 'Otro'],
    'Lujo': ['Ropa', 'Comida rica', 'Actividad recreativa', 'Dispositivo electrónico', 'Regalos', 'Membresias', 'Ajuste de gastos', 'Transporte', 'Inversion personal', 'Gym', 'Otro'],
    'Ahorro': ['Valor ahorrado', 'Otro'],
    'Entrada': ['Salario', 'Dinero extra', 'Rendimientos', 'Otro']
  };

  descripcionesDisponibles: string[] = [];
  isManualMode = true;
  isRecording = false;
  isRecordingDescription = false;
  isProcessing = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  speechAvailable = false;

  constructor(
    private transactionService: TransactionService,
    private geminiService: GeminiService,
    private speechService: SpeechService
  ) {}

  ngOnInit() {
    this.speechAvailable = this.speechService.isAvailable();
    this.onCategoriaChange();
  }

  onCategoriaChange() {
    this.descripcionesDisponibles = this.transaction.categoria 
      ? this.descripciones[this.transaction.categoria] 
      : [];
    
    // Auto-set tipo basado en categoría
    if (this.transaction.categoria === 'Entrada') {
      this.transaction.tipo = 'Ingreso';
    } else if (this.transaction.categoria === 'Ahorro') {
      this.transaction.tipo = 'Ahorro';
    } else if (this.transaction.categoria === 'Necesidad' || this.transaction.categoria === 'Lujo') {
      this.transaction.tipo = 'Egreso';
    }
  }

  toggleMode() {
    this.isManualMode = !this.isManualMode;
    this.resetForm();
    this.clearMessage();
  }

  startRecordingDescription() {
    if (!this.speechAvailable) {
      this.showMessage('Speech recognition no está disponible en tu navegador', 'error');
      return;
    }

    this.isRecordingDescription = true;
    this.showMessage('Escuchando...', 'info');

    this.speechService.listen().subscribe({
      next: (text) => {
        this.transaction.descripcion = text;
        this.isRecordingDescription = false;
        this.showMessage('Descripción capturada', 'success');
      },
      error: (error) => {
        this.isRecordingDescription = false;
        this.showMessage('Error al capturar audio: ' + error, 'error');
      }
    });
  }

  startRecordingAI() {
    if (!this.speechAvailable) {
      this.showMessage('Speech recognition no está disponible en tu navegador', 'error');
      return;
    }

    this.isRecording = true;
    this.isProcessing = false;
    this.showMessage('Escuchando... Di algo como: "Ayer gasté 2500 pesos en un helado"', 'info');

    this.speechService.listen().subscribe({
      next: (text) => {
        this.isRecording = false;
        this.isProcessing = true;
        this.showMessage('Procesando con IA...', 'info');
        
        this.geminiService.parseTransaction(text).subscribe({
          next: (parsedTransaction) => {
            this.transaction = {
              ...parsedTransaction,
              observaciones: this.transaction.observaciones
            };
            this.onCategoriaChange();
            this.isProcessing = false;
            this.showMessage('¡Transacción completada! Verifica y guarda', 'success');
          },
          error: (error) => {
            this.isProcessing = false;
            this.showMessage('Error al procesar con IA: ' + error.message, 'error');
          }
        });
      },
      error: (error) => {
        this.isRecording = false;
        this.showMessage('Error al capturar audio: ' + error, 'error');
      }
    });
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.showMessage('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    this.isProcessing = true;
    this.transactionService.create(this.transaction).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.showMessage('¡Transacción guardada exitosamente!', 'success');
        this.resetForm();
      },
      error: (error) => {
        this.isProcessing = false;
        this.showMessage('Error al guardar: ' + error.message, 'error');
      }
    });
  }

  downloadBackup() {
    this.isProcessing = true;
    this.transactionService.exportSql().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestapp_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isProcessing = false;
        this.showMessage('Backup descargado exitosamente', 'success');
      },
      error: (error) => {
        this.isProcessing = false;
        this.showMessage('Error al descargar backup: ' + error.message, 'error');
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.transaction.categoria &&
      this.transaction.descripcion &&
      this.transaction.tipo &&
      this.transaction.monto > 0 &&
      this.transaction.medio &&
      this.transaction.fecha
    );
  }

  resetForm() {
    this.transaction = {
      categoria: '',
      descripcion: '',
      tipo: '',
      monto: 0,
      medio: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: ''
    };
    this.descripcionesDisponibles = [];
  }

  showMessage(msg: string, type: 'success' | 'error' | 'info') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 5000);
  }

  clearMessage() {
    this.message = '';
  }
}
