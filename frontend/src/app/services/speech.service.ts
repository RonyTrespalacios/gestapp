import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private recognition: any;
  private isListening = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  isAvailable(): boolean {
    return !!this.recognition;
  }

  listen(): Observable<string> {
    const subject = new Subject<string>();

    if (!this.recognition) {
      subject.error('Speech recognition no disponible');
      return subject.asObservable();
    }

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

    return subject.asObservable();
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}
