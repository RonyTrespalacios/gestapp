import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload-modal.component.html',
  styleUrls: ['./file-upload-modal.component.scss']
})
export class FileUploadModalComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() initialFile: File | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File>();

  selectedFile: File | null = null;
  isDragging = false;
  dragOverCounter = 0;

  ngOnChanges(changes: SimpleChanges) {
    // Si se proporciona un archivo inicial y el modal se muestra, seleccionarlo automáticamente
    if (changes['initialFile'] && this.initialFile && this.show) {
      this.handleFile(this.initialFile);
    }
    // Si el modal se cierra, resetear el archivo seleccionado
    if (changes['show'] && !this.show) {
      this.selectedFile = null;
    }
  }

  onOverlayClick(): void {
    this.close.emit();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverCounter--;
    if (this.dragOverCounter === 0) {
      this.isDragging = false;
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverCounter++;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    this.dragOverCounter = 0;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.xlsx')) {
      this.selectedFile = file;
    } else {
      alert('Por favor selecciona un archivo .csv o .xlsx');
    }
  }

  confirmUpload(): void {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
      // No resetear aquí, el componente padre manejará el cierre
      // Solo resetear cuando se cancele
    }
  }

  cancel(): void {
    this.reset();
    this.close.emit();
  }

  private reset(): void {
    this.selectedFile = null;
    this.isDragging = false;
    this.dragOverCounter = 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

