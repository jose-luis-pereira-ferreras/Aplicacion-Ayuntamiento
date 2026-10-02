import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, map } from 'rxjs';
import { NOMBRE_APP, NOMBRE_AYTO } from './core/config';
import { iniciales } from './core/models/usuario.model';
import { SesionService } from './core/services/sesion.service';

interface EntradaMenu {
  ruta: string;
  icono: string;
  etiqueta: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly nombreApp = NOMBRE_APP;
  protected readonly nombreAyto = NOMBRE_AYTO;
  protected readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly breakpoint = inject(BreakpointObserver);

  protected readonly movil = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((estado) => estado.matches)),
    { initialValue: false },
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly esMovil = computed(() => this.movil());
  protected readonly modoCajon = computed<'over' | 'side'>(() => (this.movil() ? 'over' : 'side'));
  protected readonly abierto = computed(() => !this.movil());

  /** La pantalla de acceso va a pantalla completa, sin cromes de navegacion. */
  protected readonly pantallaAcceso = computed(() => this.url().startsWith('/sesion'));

  protected readonly menu: EntradaMenu[] = [
    { ruta: '/dashboard', icono: 'space_dashboard', etiqueta: 'Panel' },
    { ruta: '/espacios', icono: 'sports_basketball', etiqueta: 'Espacios' },
    { ruta: '/reservas', icono: 'event_available', etiqueta: 'Reservas' },
    { ruta: '/reservas/agenda', icono: 'calendar_month', etiqueta: 'Agenda' },
    { ruta: '/usuarios', icono: 'group', etiqueta: 'Usuarios' },
  ];

  protected iniciales(): string {
    return iniciales(this.sesion.usuario()?.nombre);
  }

  protected cerrarSesion(): void {
    this.sesion.cerrar();
    void this.router.navigate(['/sesion']);
  }
}
