import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './services/auth-guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Stock } from './pages/stock/stock';

import { XmlUpload } from './pages/xml-uploud/xml-uploud';
import { StockMovement } from './pages/stock-movement/stock-movement';
import { Report } from './pages/report/report';
import { Config } from './pages/config/config';


/**
 * Definição centralizada de rotas da aplicação frontend Almoxarifado.
 * Rotas públicas utilizam guestGuard (login).
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },

  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: Dashboard, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'stock', component: Stock, canActivate: [authGuard] },

  { path: 'stock/create/xml', component: XmlUpload, canActivate: [authGuard] },

  { path: 'stock-movement', component: StockMovement, canActivate: [authGuard] },
  { path: 'report', component: Report, canActivate: [authGuard] },
  { path: 'config', component: Config, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' },
];