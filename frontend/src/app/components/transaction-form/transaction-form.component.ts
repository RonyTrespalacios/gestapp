import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { SpeechService, SpeechResult } from '../../services/speech.service';

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
  capturedTranscript = ''; // Almacena el texto capturado en tiempo real
  geminiResponse: any = null; // Almacena la respuesta JSON de Gemini
  showJsonResponse = false; // Toggle para mostrar/ocultar JSON
  canEdit = false; // Indica si el usuario puede editar el texto capturado
  isFocused = false; // Indica si el textarea está enfocado

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

    // Reset descripción cuando cambia categoría
    this.transaction.descripcion = '';
  }

  toggleMode() {
    this.isManualMode = !this.isManualMode;
    this.resetForm();
    this.clearMessage();
  }

  startRecordingObservations() {
    if (!this.speechAvailable) {
      return;
    }

    this.isRecordingDescription = true;
    this.transaction.observaciones = '';

    this.speechService.listenRealTime().subscribe({
      next: (result: SpeechResult) => {
        this.transaction.observaciones = result.transcript;
        
        if (result.isFinal) {
          this.isRecordingDescription = false;
        }
      },
      error: (error: any) => {
        this.isRecordingDescription = false;
      },
      complete: () => {
        this.isRecordingDescription = false;
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
    this.canEdit = false;
    this.capturedTranscript = ''; // Limpiar transcripción anterior
    this.geminiResponse = null;
    this.showJsonResponse = false;
    this.showMessage('Escuchando... Habla ahora', 'info');

    // Usar transcripción en tiempo real
    this.speechService.listenRealTime().subscribe({
      next: (result: SpeechResult) => {
        // Actualizar transcripción en tiempo real (muestra mientras hablas)
        this.capturedTranscript = result.transcript;
        this.showMessage(`"${result.transcript}"`, 'info');
        
        if (result.isFinal) {
          // Cuando termina de hablar, permitir edición
          this.isRecording = false;
          this.canEdit = true;
          this.showMessage('Captura finalizada. Puedes editar el texto o enviarlo directamente.', 'success');
        }
      },
      error: (error: any) => {
        this.isRecording = false;
        this.capturedTranscript = '';
        this.canEdit = false;
        this.showMessage('Error al capturar audio: ' + error, 'error');
      },
      complete: () => {
        this.isRecording = false;
      }
    });
  }

  pauseRecording() {
    if (this.isRecording) {
      this.speechService.stop();
      this.isRecording = false;
      this.canEdit = true;
      this.showMessage('Grabacion pausada. Puedes editar el texto o continuar.', 'info');
    }
  }

  sendTranscriptToAI() {
    if (!this.capturedTranscript.trim()) {
      return;
    }

    // Detener el reconocimiento de voz si está activo
    if (this.isRecording) {
      this.speechService.stop();
      this.isRecording = false;
    }

    const userMessage = this.capturedTranscript;
    this.capturedTranscript = '';
    this.isProcessing = true;
    
    this.geminiService.parseTransaction(userMessage).subscribe({
      next: (parsedTransaction: any) => {
        this.geminiResponse = parsedTransaction;
        this.transaction = {
          ...parsedTransaction,
          observaciones: this.transaction.observaciones || ''
        };
        this.onCategoriaChange();
        this.isProcessing = false;
      },
      error: (error: any) => {
        this.isProcessing = false;
      }
    });
  }

  clearTranscript() {
    // Detener reconocimiento si está activo
    if (this.isRecording) {
      this.speechService.stop();
    }
    
    this.capturedTranscript = '';
    this.geminiResponse = null;
    this.showJsonResponse = false;
    this.canEdit = false;
    this.isRecording = false;
    this.isProcessing = false;
    this.clearMessage();
  }

  toggleJsonView() {
    this.showJsonResponse = !this.showJsonResponse;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      return;
    }

    this.isProcessing = true;
    this.transactionService.create(this.transaction).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.resetForm();
        this.clearTranscript();
      },
      error: (error) => {
        this.isProcessing = false;
      }
    });
  }

  confirmAITransaction() {
    if (!this.isFormValid()) {
      return;
    }

    this.isProcessing = true;
    this.transactionService.create(this.transaction).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.resetForm();
        this.clearTranscript();
      },
      error: (error) => {
        this.isProcessing = false;
      }
    });
  }

  cancelAITransaction() {
    this.clearTranscript();
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
