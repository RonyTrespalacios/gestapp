import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, NgZone, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { SpeechService, SpeechResult } from '../../services/speech.service';
import { ModalComponent } from '../modal/modal.component';
import { MicToggleButtonComponent } from '../mic-toggle-button/mic-toggle-button.component';
import { TransactionStateService } from '../../services/transaction-state.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, MicToggleButtonComponent],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit, OnDestroy {
  @Input() forceManualMode?: boolean;
  @ViewChild('messageTextarea') messageTextarea?: ElementRef<HTMLTextAreaElement>;
  
  private navigationSubscription: any;
  
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
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';
  isRecording = false;
  isRecordingDescription = false;
  isProcessing = false;
  isEditingGeminiResponse = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  speechAvailable = false;
  capturedTranscript = ''; // Almacena el texto capturado en tiempo real
  geminiResponse: any = null; // Almacena la respuesta JSON de Gemini
  showJsonResponse = false; // Toggle para mostrar/ocultar JSON
  canEdit = false; // Indica si el usuario puede editar el texto capturado
  isFocused = false; // Indica si el textarea está enfocado
  userMessage = ''; // Almacena el último mensaje enviado por el usuario

  constructor(
    private transactionService: TransactionService,
    private geminiService: GeminiService,
    private speechService: SpeechService,
    private router: Router,
    private transactionStateService: TransactionStateService,
    private ngZone: NgZone
  ) {
    // Observar cambios en el signal de transacción para editar
    // Esto permite que el formulario se actualice automáticamente cuando
    // el widget de chat guarda una nueva transacción, incluso si ya estamos en esta ruta
    effect(() => {
      const transactionToEdit = this.transactionStateService.transactionToEdit$();
      // Solo cargar si hay una transacción y estamos en modo manual
      // El effect se ejecuta después de ngOnInit, así que isManualMode ya debería estar establecido
      if (transactionToEdit) {
        console.log('🔄 Signal detectado: nueva transacción para editar', transactionToEdit);
        // Usar setTimeout para asegurar que se ejecute después del ciclo actual
        // y que isManualMode ya esté establecido
        setTimeout(() => {
          if (this.isManualMode) {
            this.loadPendingTransaction();
          }
        }, 100);
      }
    });
  }

  ngOnInit() {
    console.log('🔄 ngOnInit ejecutado, forceManualMode:', this.forceManualMode);
    
    if (this.forceManualMode !== undefined) {
      this.isManualMode = this.forceManualMode;
    }
    this.speechAvailable = this.speechService.isAvailable();
    
    // Cargar transacción para editar
    this.loadPendingTransaction();
    
    // Suscribirse a cambios de navegación para detectar cuando regresamos a esta ruta
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        console.log('🔄 Navegación detectada');
        this.loadPendingTransaction();
      });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private loadPendingTransaction() {
    // Verificar si hay una transacción para editar ANTES de onCategoriaChange
    const transactionToEdit = this.transactionStateService.getTransactionToEdit();
    if (transactionToEdit && this.isManualMode) {
      console.log('📝 Cargando transacción para editar en formulario manual:', transactionToEdit);
      this.transaction = { ...transactionToEdit };
      this.onCategoriaChange(false); // No resetear descripción
      this.transactionStateService.clearTransactionToEdit();
    } else if (!transactionToEdit) {
      this.onCategoriaChange();
    }
  }

  onCategoriaChange(resetDescription: boolean = true) {
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

    // Reset descripción cuando cambia categoría (solo en modo manual)
    if (resetDescription) {
      this.transaction.descripcion = '';
    }
  }

  toggleMode() {
    // Pausar cualquier grabación activa
    if (this.isRecording) {
      this.pauseRecording();
    }
    if (this.isRecordingDescription) {
      this.pauseRecordingObservations();
    }
    
    this.isManualMode = !this.isManualMode;
    this.resetForm();
    this.clearMessage();
  }

  startRecordingObservations() {
    if (!this.speechAvailable) {
      this.showMessage('Speech recognition no está disponible en tu navegador', 'error');
      return;
    }

    this.isRecordingDescription = true;
    this.transaction.observaciones = '';

    this.speechService.listenRealTime().subscribe({
      next: (result: SpeechResult) => {
        // Asegurar cambio de detección dentro de Angular
        this.ngZone.run(() => {
          this.transaction.observaciones = result.transcript;
        });
        // No cerrar automáticamente, el usuario debe pausar manualmente
      },
      error: (error: any) => {
        this.isRecordingDescription = false;
        this.showMessage('Error al capturar audio: ' + error, 'error');
      },
      complete: () => {
        this.isRecordingDescription = false;
      }
    });
  }

  pauseRecordingObservations() {
    if (this.isRecordingDescription) {
      this.speechService.stop();
      this.isRecordingDescription = false;
    }
  }

  startRecordingAI() {
    if (!this.speechAvailable) {
      this.showMessage('Speech recognition no está disponible en tu navegador', 'error');
      return;
    }

    this.isRecording = true;
    this.isProcessing = false;
    this.canEdit = true; // Siempre permitir edición
    this.capturedTranscript = ''; // Limpiar transcripción anterior
    this.geminiResponse = null;
    this.showJsonResponse = false;
    this.showMessage('Escuchando... Habla ahora. Presiona Enter o el botón de enviar cuando termines.', 'info');

    // Usar transcripción en tiempo real
    this.speechService.listenRealTime().subscribe({
      next: (result: SpeechResult) => {
        // Actualizar transcripción en tiempo real (muestra mientras hablas)
        this.ngZone.run(() => {
          this.capturedTranscript = result.transcript;
          // Auto-resize textarea cuando cambie el contenido
          setTimeout(() => this.resizeMessageTextarea(), 0);
        });
        // No cerrar automáticamente, el usuario debe presionar Enter o botón enviar
      },
      error: (error: any) => {
        this.isRecording = false;
        this.capturedTranscript = '';
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
      this.showMessage('Grabación pausada. Puedes editar el texto o continuar.', 'info');
    }
  }

  onEnterPress(event: KeyboardEvent) {
    // Si presiona Enter sin Shift, enviar mensaje
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendTranscriptToAI();
    }
    // Si presiona Shift+Enter, permite nueva línea (comportamiento por defecto)
  }

  sendTranscriptToAI() {
    if (!this.capturedTranscript.trim()) {
      return;
    }

    // Detener cualquier grabación activa
    if (this.isRecording) {
      this.speechService.stop();
      this.isRecording = false;
    }
    if (this.isRecordingDescription) {
      this.pauseRecordingObservations();
    }

    // Guardar el mensaje del usuario para mostrarlo en el chat
    this.userMessage = this.capturedTranscript;
    this.capturedTranscript = '';
    this.isProcessing = true;
    this.geminiResponse = null; // Limpiar respuesta anterior
    
    this.geminiService.parseTransaction(this.userMessage).subscribe({
      next: (parsedTransaction: any) => {
        console.log('🟢 Respuesta de Gemini recibida en frontend:', parsedTransaction);
        console.log('   📝 Descripción recibida:', parsedTransaction.descripcion);
        
        this.geminiResponse = parsedTransaction;
        this.transaction = {
          ...parsedTransaction,
          observaciones: this.transaction.observaciones || parsedTransaction.observaciones || ''
        };
        
        console.log('🟣 Transaction object después de mapear:', this.transaction);
        console.log('   📝 Descripción en transaction:', this.transaction.descripcion);
        
        // No resetear descripción porque viene de la IA
        this.onCategoriaChange(false);
        
        console.log('✅ Transaction object final:', this.transaction);
        console.log('   📝 Descripción final:', this.transaction.descripcion);
        
        this.isProcessing = false;
      },
      error: (error: any) => {
        console.error('❌ Error en parseTransaction:', error);
        this.isProcessing = false;
        this.showModalMessage('Error', 'Error al procesar con IA: ' + (error.message || error.error?.message || 'Error desconocido'), 'error');
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
    this.userMessage = '';
    this.clearMessage();
  }

  toggleJsonView() {
    this.showJsonResponse = !this.showJsonResponse;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      return;
    }

    // Pausar cualquier grabación activa
    if (this.isRecording) {
      this.pauseRecording();
    }
    if (this.isRecordingDescription) {
      this.pauseRecordingObservations();
    }

    this.isProcessing = true;
    this.transactionService.create(this.transaction).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.showModalMessage('Éxito', 'Transacción guardada exitosamente!', 'success');
        this.resetForm();
        this.clearTranscript();
      },
      error: (error) => {
        this.isProcessing = false;
        this.showModalMessage('Error', 'Error al guardar la transacción', 'error');
        console.error('Error:', error);
      }
    });
  }

  confirmAITransaction() {
    if (!this.isFormValid()) {
      console.log('Form not valid:', this.transaction);
      this.showModalMessage('Validación', 'Por favor completa todos los campos requeridos', 'error');
      return;
    }

    this.isProcessing = true;
    this.transactionService.create(this.transaction).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.showModalMessage('Éxito', 'Transacción guardada exitosamente!', 'success');
        this.resetForm();
        this.clearTranscript();
        this.geminiResponse = null;
        this.userMessage = '';
      },
      error: (error) => {
        this.isProcessing = false;
        this.showModalMessage('Error', 'Error al guardar la transacción', 'error');
        console.error('Error:', error);
      }
    });
  }

  cancelAITransaction() {
    this.clearTranscript();
    this.geminiResponse = null;
    this.isEditingGeminiResponse = false;
    this.resetForm();
  }

  editGeminiResponse() {
    console.log('✏️ Editando respuesta de Gemini:', this.transaction);
    // Guardar la transacción en el servicio compartido
    this.transactionStateService.setTransactionToEdit(this.transaction);
    // Navegar a /registrar/manual
    this.router.navigate(['/registrar/manual']).then(() => {
      console.log('✅ Navegación completada a /registrar/manual');
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
    // Pausar cualquier grabación activa
    if (this.isRecording) {
      this.pauseRecording();
    }
    if (this.isRecordingDescription) {
      this.pauseRecordingObservations();
    }

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

  showModalMessage(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  formatMontoDisplay(): string {
    if (!this.transaction.monto || this.transaction.monto === 0) {
      return '';
    }
    return this.formatCOP(this.transaction.monto);
  }

  formatCOP(value: number): string {
    const strValue = Math.floor(value).toString();
    let formatted = '';
    
    // Recorrer desde el final hacia el inicio
    for (let i = strValue.length - 1, count = 0; i >= 0; i--, count++) {
      // Agregar separador cada 3 dígitos
      if (count > 0 && count % 3 === 0) {
        // Para los primeros 3 dígitos (desde la derecha), usar punto
        // Para los siguientes, usar comilla simple
        formatted = (count === 3 ? '.' : "'") + formatted;
      }
      formatted = strValue[i] + formatted;
    }

    return formatted + ' COP';
  }

  onMontoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remover todo lo que no sea número
    const value = input.value.replace(/[^0-9]/g, '');
    
    if (value === '') {
      this.transaction.monto = 0;
      return;
    }

    const numericValue = parseInt(value, 10);
    this.transaction.monto = numericValue;
  }

  autoResizeTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    // Resetear altura para calcular scrollHeight correctamente
    textarea.style.height = 'auto';
    // Establecer altura basada en el contenido
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  resizeMessageTextarea(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }
}
