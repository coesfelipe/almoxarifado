import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './services/auth-guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Stock } from './pages/stock/stock';
import { CreateProduct } from './pages/create-product/create-product';
import { EditProduct } from './pages/edit-product/edit-product';
import { XmlUpload } from './pages/xml-uploud/xml-uploud';
import { StockMovement } from './pages/stock-movement/stock-movement';
import { Report } from './pages/report/report';
import { Config } from './pages/config/config';
import { UsersManagement } from './pages/users-management/users-management';

/**
 * Definição centralizada de rotas da aplicação frontend Almoxarifado.
 * Rotas públicas utilizam guestGuard (login).
 * Rotas operacionais utilizam authGuard (requerem token JWT).
 * Rotas administrativas exclusivas (gestão de contas) utilizam adminGuard.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  // O cadastro público foi desativado conforme requisitos de segurança (criação restrita a ADMIN)
  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: Dashboard, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'stock', component: Stock, canActivate: [authGuard] },
  { path: 'stock/create', component: CreateProduct, canActivate: [authGuard] },
  { path: 'stock/create/xml', component: XmlUpload, canActivate: [authGuard] },
  { path: 'stock/edit/:id', component: EditProduct, canActivate: [authGuard] },
  { path: 'stock-movement', component: StockMovement, canActivate: [authGuard] },
  { path: 'report', component: Report, canActivate: [authGuard] },
  { path: 'config', component: Config, canActivate: [authGuard] },
  // Gestão e cadastro de usuários acessível apenas por administradores via footer
  { path: 'users', component: UsersManagement, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: 'login' },
];