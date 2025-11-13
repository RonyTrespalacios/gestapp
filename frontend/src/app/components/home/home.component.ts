import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AiChatWidgetComponent } from '../ai-chat-widget/ai-chat-widget.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AiChatWidgetComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(public authService: AuthService) {}

  get firstName(): string {
    const user = this.authService.currentUserValue;
    if (!user || !user.name) {
      return '';
    }
    // Obtener solo el primer nombre y capitalizarlo
    const first = user.name.trim().split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }

  get hasName(): boolean {
    return !!this.firstName;
  }
}


