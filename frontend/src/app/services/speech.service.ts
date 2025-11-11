import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private recognition: any;
  private isListening = false;

  constructor() {
    // Usar window.SpeechRecognition o window.webkitSpeechRecognition (API nativa del navegador)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = true; // Habilitar modo continuo para captura prolongada
      this.recognition.interimResults = true; // Habilitar resultados intermedios en tiempo real
      this.recognition.maxAlternatives = 1;
      
      console.log('✅ Reconocimiento de voz inicializado correctamente');
    } else {
      console.warn('⚠️ Speech Recognition no soportado en este navegador');
    }
  }

  isAvailable(): boolean {
    return !!this.recognition;
  }

  /**
   * Escucha con transcripción en tiempo real
   * Emite resultados intermedios (isFinal: false) y finales (isFinal: true)
   * Sigue el patrón de la Web Speech API nativa del navegador
   */
  listenRealTime(): Observable<SpeechResult> {
    const subject = new Subject<SpeechResult>();

    if (!this.recognition) {
      subject.error('Speech recognition no disponible en este navegador');
      return subject.asObservable();
    }

    // Detener cualquier reconocimiento previo
    if (this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (e) {
        console.log('No había reconocimiento activo');
      }
    }

    // Acumular el transcript completo
    let fullTranscript = '';

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Reconocimiento de voz iniciado');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🛑 Reconocimiento de voz finalizado');
      
      // Emitir el texto final acumulado si existe
      if (fullTranscript.trim()) {
        subject.next({ 
          transcript: fullTranscript.trim(), 
          isFinal: true 
        });
      }
      subject.complete();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Iterar por todos los resultados (igual que en tu ejemplo)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Actualizar el transcript completo con resultados finales
      if (finalTranscript) {
        fullTranscript += finalTranscript;
        subject.next({ 
          transcript: fullTranscript.trim(), 
          isFinal: true 
        });
      }

      // Emitir transcripción temporal (mientras hablas)
      if (interimTranscript) {
        subject.next({ 
          transcript: (fullTranscript + interimTranscript).trim(), 
          isFinal: false 
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Error en reconocimiento de voz:', event.error);
      
      // Manejo de errores específicos (igual que en tu ejemplo)
      if (event.error === 'no-speech') {
        subject.error('No se detectó voz. Intenta de nuevo.');
      } else if (event.error === 'not-allowed') {
        subject.error('Permiso de micrófono denegado. Por favor permite el acceso al micrófono en tu navegador.');
      } else if (event.error === 'aborted') {
        // No reportar error si fue abortado intencionalmente
        console.log('⚠️ Reconocimiento abortado por el usuario');
      } else {
        subject.error(`Error: ${event.error}`);
      }
      
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('❌ Error al iniciar reconocimiento:', error);
      subject.error('No se pudo iniciar el reconocimiento de voz');
    }

    return subject.asObservable();
  }

  /**
   * Método legacy: escucha sin transcripción en tiempo real (para compatibilidad)
   */
  listen(): Observable<string> {
    const subject = new Subject<string>();

    if (!this.recognition) {
      subject.error('Speech recognition no disponible');
      return subject.asObservable();
    }

    // Configurar para un solo resultado final
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      subject.next(transcript);
      subject.complete();
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      subject.error(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      subject.error(error);
    }

    // Restaurar configuración para modo real-time después
    setTimeout(() => {
      if (this.recognition) {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      }
    }, 100);

    return subject.asObservable();
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        console.log('🛑 Reconocimiento de voz detenido manualmente');
      } catch (error) {
        console.error('Error al detener reconocimiento:', error);
      }
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}
