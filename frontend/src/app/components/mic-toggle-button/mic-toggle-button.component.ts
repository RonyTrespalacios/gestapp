import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mic-toggle-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mic-toggle-button.component.html',
  styleUrls: ['./mic-toggle-button.component.scss']
})
export class MicToggleButtonComponent {
  @Input() isActive: boolean = false;
  @Input() disabled: boolean = false;
  @Input() title: string = 'Activar/Desactivar micrófono';
  @Output() toggle = new EventEmitter<void>();

  onClick(): void {
    if (this.disabled) {
      return;
    }
    this.toggle.emit();
  }
}


