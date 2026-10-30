import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { UsersService, UserItem } from '../../services/users';
import { AuthService, UserRole } from '../../services/auth';

/**
 * Componente da Página de Gestão e Cadastro de Usuários (Exclusiva para Administradores).
 * Permite a criação de novas contas definindo explicitamente o nível de permissão (ADMIN ou USER),
 * listagem com auditoria, edição cadastral e exclusão segura.
 */
@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Navbar, Footer, KpiCard, ConfirmModal],
  templateUrl: './users-management.html',
  styleUrls: ['./users-management.css'],
})
export class UsersManagement implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  // Estados reativos
  usuarios = signal<UserItem[]>([]);
  carregando = signal<boolean>(true);
  salvando = signal<boolean>(false);
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);
  busca = signal<string>('');

  // Modais de Criação e Edição
  modalCriarAberto = signal<boolean>(false);
  modalEditarAberto = signal<boolean>(false);
  usuarioEmEdicao = signal<UserItem | null>(null);

  // Modal de Confirmação de Exclusão
  modalExcluirAberto = signal<boolean>(false);
  usuarioParaExcluir = signal<UserItem | null>(null);

  // ID do usuário atualmente conectado (para impedir autoexclusão)
  currentUserId = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  });

  // Formulário de Cadastro de Novo Usuário (com definição de role)
  formCriar = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['USER' as UserRole, [Validators.required]],
  });

  // Formulário de Edição de Usuário
  formEditar = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['USER' as UserRole, [Validators.required]],
    password: ['', [Validators.minLength(6)]],
  });

  // Lista filtrada pelo campo de busca
  usuariosFiltrados = computed(() => {
    const termo = this.busca().toLowerCase().trim();
    if (!termo) return this.usuarios();
    return this.usuarios().filter(
      (u) => u.name.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo),
    );
  });

  // Indicadores (KPIs)
  totalUsuarios = computed(() => this.usuarios().length);
  totalAdmins = computed(() => this.usuarios().filter((u) => u.role === 'ADMIN').length);
  totalOperadores = computed(() => this.usuarios().filter((u) => u.role === 'USER').length);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarUsuarios();
    }
  }

  carregarUsuarios(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.usersService.getUsers().subscribe({
      next: (dados) => {
        this.usuarios.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao listar usuários:', err);
        this.erro.set(err.error?.message || 'Não foi possível carregar a lista de usuários.');
        this.carregando.set(false);
      },
    });
  }

  // --- Criação de Novo Usuário ---

  abrirModalCriar(): void {
    this.formCriar.reset({
      name: '',
      email: '',
      password: '',
      role: 'USER',
    });
    this.erro.set(null);
    this.modalCriarAberto.set(true);
  }

  fecharModalCriar(): void {
    this.modalCriarAberto.set(false);
  }

  salvarNovoUsuario(): void {
    if (this.formCriar.invalid) {
      this.formCriar.markAllAsTouched();
      return;
    }

    const { name, email, password, role } = this.formCriar.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    this.usersService.createUser({ name, email, password, role }).subscribe({
      next: (novo) => {
        this.sucesso.set(`Usuário '${novo.name}' cadastrado com sucesso com perfil ${novo.role}!`);
        this.salvando.set(false);
        this.fecharModalCriar();
        this.carregarUsuarios();
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err.error?.message || 'Erro ao cadastrar novo usuário.');
      },
    });
  }

  // --- Edição de Usuário ---

  abrirModalEditar(usuario: UserItem): void {
    this.usuarioEmEdicao.set(usuario);
    this.formEditar.patchValue({
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      password: '',
    });
    this.erro.set(null);
    this.modalEditarAberto.set(true);
  }

  fecharModalEditar(): void {
    this.modalEditarAberto.set(false);
    this.usuarioEmEdicao.set(null);
  }

  salvarEdicaoUsuario(): void {
    if (this.formEditar.invalid) {
      this.formEditar.markAllAsTouched();
      return;
    }

    const user = this.usuarioEmEdicao();
    if (!user) return;

    const values = this.formEditar.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);

    const payload: any = {
      name: values.name || undefined,
      email: values.email || undefined,
      role: values.role || undefined,
    };

    if (values.password && values.password.trim().length >= 6) {
      payload.password = values.password.trim();
    }

    this.usersService.updateUser(user.id, payload).subscribe({
      next: (atualizado) => {
        this.sucesso.set(`Usuário '${atualizado.name}' atualizado com sucesso!`);
        this.salvando.set(false);
        this.fecharModalEditar();
        this.carregarUsuarios();
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err.error?.message || 'Erro ao atualizar dados do usuário.');
      },
    });
  }

  // --- Exclusão de Usuário ---

  confirmarExclusao(usuario: UserItem): void {
    if (this.currentUserId() === usuario.id) {
      alert('Você não pode excluir sua própria conta de administrador.');
      return;
    }
    this.usuarioParaExcluir.set(usuario);
    this.modalExcluirAberto.set(true);
  }

  executarExclusao(): void {
    const user = this.usuarioParaExcluir();
    if (!user) return;

    this.salvando.set(true);
    this.usersService.deleteUser(user.id).subscribe({
      next: (res) => {
        this.sucesso.set(res.message || `Usuário excluído com sucesso.`);
        this.salvando.set(false);
        this.modalExcluirAberto.set(false);
        this.usuarioParaExcluir.set(null);
        this.carregarUsuarios();
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err.error?.message || 'Erro ao excluir usuário.');
        this.modalExcluirAberto.set(false);
      },
    });
  }

  cancelarExclusao(): void {
    this.modalExcluirAberto.set(false);
    this.usuarioParaExcluir.set(null);
  }
}

