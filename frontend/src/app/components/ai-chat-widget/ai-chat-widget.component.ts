import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeminiService } from '../../services/gemini.service';
import { SpeechService, SpeechResult } from '../../services/speech.service';
import { TransactionStateService } from '../../services/transaction-state.service';
import { Transaction } from '../../services/transaction.service';
import { MicToggleButtonComponent } from '../mic-toggle-button/mic-toggle-button.component';

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MicToggleButtonComponent],
  templateUrl: './ai-chat-widget.component.html',
  styleUrls: ['./ai-chat-widget.component.scss']
})
export class AiChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessagesRef?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInputRef?: ElementRef<HTMLTextAreaElement>;

  isOpen = false;
  isMinimized = false;
  message = '';
  isProcessing = false;
  isRecording = false;
  messages: ChatMessage[] = [];
  speechAvailable = false;
  isFocused = false;

  constructor(
    private geminiService: GeminiService,
    private speechService: SpeechService,
    private transactionStateService: TransactionStateService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.speechAvailable = this.speechService.isAvailable();
    // Agregar mensaje inicial
    this.messages.push({
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de IA. Describe tu transacción con lenguaje natural y te ayudaré a registrarla.',
      timestamp: new Date()
    });
  }

  ngOnDestroy() {
    if (this.isRecording) {
      this.speechService.stop();
    }
  }

  toggleWidget() {
    if (this.isMinimized) {
      this.isMinimized = false;
      this.isOpen = true;
    } else {
      this.isOpen = !this.isOpen;
    }
  }

  minimizeWidget() {
    this.isMinimized = true;
    this.isOpen = false;
  }

  startRecording() {
    if (!this.speechAvailable) {
      this.addMessage('assistant', 'El reconocimiento de voz no está disponible en tu navegador.');
      return;
    }

    this.isRecording = true;
    this.message = '';

    this.speechService.listenRealTime().subscribe({
      next: (result: SpeechResult) => {
        this.ngZone.run(() => {
          this.message = result.transcript;
          this.autoResizeTextarea();
        });
      },
      error: (error: any) => {
        this.isRecording = false;
        this.addMessage('assistant', 'Error al capturar audio: ' + error);
      },
      complete: () => {
        this.isRecording = false;
      }
    });
  }

  stopRecording() {
    if (this.isRecording) {
      this.speechService.stop();
      this.isRecording = false;
    }
  }

  onEnterPress(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (!this.message.trim() || this.isProcessing) {
      return;
    }

    const userMessage = this.message.trim();
    this.addMessage('user', userMessage);
    this.message = '';
    this.isProcessing = true;
    this.stopRecording();

    // No agregar mensaje de procesamiento aquí, se mostrará con el indicador visual

    this.geminiService.parseTransaction(userMessage).subscribe({
      next: (parsedTransaction: Transaction) => {
        // Mostrar respuesta de la IA
        const responseText = this.formatTransactionResponse(parsedTransaction);
        this.addMessage('assistant', responseText);

        // Guardar transacción
        this.transactionStateService.setTransactionToEdit(parsedTransaction);
        this.isProcessing = false;
        
        // Verificar si ya estamos en /registrar/manual
        const currentUrl = this.router.url;
        const isAlreadyOnManualPage = currentUrl === '/registrar/manual' || currentUrl.startsWith('/registrar/manual');
        
        if (isAlreadyOnManualPage) {
          // Si ya estamos en la página manual, no navegar
          // El effect en TransactionFormComponent detectará el cambio y cargará los datos
          console.log('✅ Ya estamos en /registrar/manual, los datos se cargarán automáticamente');
          // Minimizar el widget después de un breve delay
          setTimeout(() => {
            this.minimizeWidget();
          }, 500);
        } else {
          // Si no estamos en la página manual, navegar allí
          setTimeout(() => {
            this.router.navigate(['/registrar/manual']).then(() => {
              // Minimizar el widget después de navegar
              this.minimizeWidget();
            });
          }, 500);
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Error desconocido al procesar la transacción';
        this.addMessage('assistant', `❌ Error: ${errorMessage}`);
        this.isProcessing = false;
      }
    });
  }

  private formatTransactionResponse(transaction: Transaction): string {
    return `✅ Transacción procesada:\n\n` +
           `📁 Categoría: ${transaction.categoria}\n` +
           `📝 Descripción: ${transaction.descripcion || '(vacío)'}\n` +
           `💰 Tipo: ${transaction.tipo}\n` +
           `💵 Monto: $${this.formatNumber(transaction.monto)}\n` +
           `💳 Medio: ${transaction.medio}\n` +
           `📅 Fecha: ${transaction.fecha}\n` +
           (transaction.observaciones ? `📌 Observaciones: ${transaction.observaciones}\n` : '') +
           `\n🔄 Redirigiendo al formulario manual para que puedas revisar y editar...`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private addMessage(type: 'user' | 'assistant', content: string) {
    this.messages.push({
      type,
      content,
      timestamp: new Date()
    });
    // Scroll al final
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private scrollToBottom() {
    if (this.chatMessagesRef?.nativeElement) {
      const element = this.chatMessagesRef.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  autoResizeTextarea() {
    if (this.messageInputRef?.nativeElement) {
      const textarea = this.messageInputRef.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  onTextareaInput() {
    this.autoResizeTextarea();
  }

  clearChat() {
    this.messages = [{
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de IA. Describe tu transacción con lenguaje natural y te ayudaré a registrarla.',
      timestamp: new Date()
    }];
    this.message = '';
  }
}

