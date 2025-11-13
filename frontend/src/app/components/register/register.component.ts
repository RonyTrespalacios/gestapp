import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../modal/modal.component';

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
}

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
  
  passwordValidation: PasswordValidation = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  validatePassword() {
    this.passwordValidation = {
      minLength: this.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasLowerCase: /[a-z]/.test(this.password),
      hasNumber: /[0-9]/.test(this.password)
    };
  }

  get isPasswordValid(): boolean {
    return Object.values(this.passwordValidation).every(v => v === true);
  }

  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  onSubmit() {
    if (!this.name || !this.name.trim()) {
      this.showModalMessage('Error', 'El nombre es obligatorio', 'error');
      return;
    }

    if (!this.email || !this.email.trim()) {
      this.showModalMessage('Error', 'El correo electrónico es obligatorio', 'error');
      return;
    }

    if (!this.validateEmail()) {
      this.showModalMessage('Error', 'Por favor ingresa un correo electrónico válido', 'error');
      return;
    }

    if (!this.password) {
      this.showModalMessage('Error', 'La contraseña es obligatoria', 'error');
      return;
    }

    if (!this.isPasswordValid) {
      this.showModalMessage('Error', 'La contraseña no cumple con los requisitos de seguridad', 'error');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showModalMessage('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.register(this.email, this.password, this.name.trim()).subscribe({
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

