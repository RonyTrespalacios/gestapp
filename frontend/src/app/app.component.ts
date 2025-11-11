import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-wrapper">
      <header class="header">
        <h1>GestApp</h1>
        <nav class="nav">
          <a routerLink="/registrar" routerLinkActive="active" class="nav-link">Registrar</a>
          <a routerLink="/datos" routerLinkActive="active" class="nav-link">Ver Datos</a>
        </nav>
      </header>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'GestApp';
}
