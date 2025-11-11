import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  status: 'pending' | 'success' | 'error' = 'pending';
  message = 'Verificando tu cuenta...';
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';

  private apiUrl = `${environment.apiUrl}/auth/verify-email`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status = 'error';
      this.message = 'Token inválido.';
      this.show('Error', 'Token de verificación inválido.', 'error');
      return;
    }

    this.http.get(`${this.apiUrl}?token=${encodeURIComponent(token)}`).subscribe({
      next: () => {
        this.status = 'success';
        this.message = '¡Email verificado! Redirigiendo a login...';
        this.show('Éxito', 'Tu email ha sido verificado. Ahora puedes iniciar sesión.', 'success');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        console.error('Verify error:', err);
        this.status = 'error';
        this.message = 'No se pudo verificar el email.';
        this.show('Error', 'No se pudo verificar el email. Revisa el enlace o genera uno nuevo.', 'error');
      }
    });
  }

  private show(title: string, message: string, type: 'success' | 'error' | 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}


