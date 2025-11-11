import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  name = '';
  isLoading = false;
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.showModalMessage('Error', 'Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (this.password.length < 6) {
      this.showModalMessage('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showModalMessage('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.register(this.email, this.password, this.name || undefined).subscribe({
      next: (response) => {
        this.showModalMessage(
          'Éxito', 
          `${response.message} Revisa tu correo para verificar tu cuenta.`, 
          'success'
        );
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Register error:', error);
        const message = error.error?.message || 'Error al registrar usuario';
        this.showModalMessage('Error', message, 'error');
        this.isLoading = false;
      }
    });
  }

  showModalMessage(title: string, message: string, type: 'success' | 'error' | 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}

