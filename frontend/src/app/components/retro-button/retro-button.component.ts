import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type RetroButtonVariant = 'primary' | 'confirm' | 'danger' | 'ghost';

@Component({
  selector: 'app-retro-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retro-button.component.html',
  styleUrls: ['./retro-button.component.scss']
})
export class RetroButtonComponent {
  @Input() variant: RetroButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  get variantClass(): string {
    return `variant-${this.variant}`;
  }
}

