import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { AuthService, UserRole } from '../../services/auth';
import { Footer } from '../../components/footer/footer';
import { SectorService, Sector } from '../../services/sector';
import { CategoryService, Category } from '../../services/category';
import { UsersService, UserItem } from '../../services/users';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Navbar, Footer],
  selector: 'app-config',
  styleUrl: './config.css',
  templateUrl: './config.html',
})
export class Config implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sectorService = inject(SectorService);
  private categoryService = inject(CategoryService);
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  // Aba selecionada: 'sectors' | 'categories' | 'users' | 'account'
  activeTab = signal<'sectors' | 'categories' | 'users' | 'account'>('sectors');

  // Regra de Role (Administrador)
  isAdmin = computed(() => this.authService.isAdmin);

  currentUserId = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  });

  // ───────── Gestão de Setores ─────────
  setores = signal<Sector[]>([]);
  loadingSetores = signal<boolean>(false);
  buscaSetor = signal<string>('');
  modalSetorAberto = signal<boolean>(false);
  setorEmEdicao = signal<Sector | null>(null);
  nomeSetor = signal<string>('');
  descricaoSetor = signal<string>('');
  salvandoSetor = signal<boolean>(false);
  setorSuccessMessage = signal<string>('');
  setorErrorMessage = signal<string>('');

  setoresFiltrados = computed(() => {
    const termo = this.normalizar(this.buscaSetor());
    const lista = this.setores();
    return termo ? lista.filter((s) => this.normalizar(s.name).includes(termo)) : lista;
  });

  // ───────── Gestão de Categorias ─────────
  categorias = signal<Category[]>([]);
  loadingCategorias = signal<boolean>(false);
  buscaCategoria = signal<string>('');
  modalCategoriaAberto = signal<boolean>(false);
  categoriaEmEdicao = signal<Category | null>(null);
  nomeCategoria = signal<string>('');
  descricaoCategoria = signal<string>('');
  salvandoCategoria = signal<boolean>(false);
  categoriaSuccessMessage = signal<string>('');
  categoriaErrorMessage = signal<string>('');

  categoriasFiltradas = computed(() => {
    const termo = this.normalizar(this.buscaCategoria());
    const lista = this.categorias();
    return termo ? lista.filter((c) => this.normalizar(c.name).includes(termo)) : lista;
  });

  // ───────── Gestão de Usuários (ADM) ─────────
  usuarios = signal<UserItem[]>([]);
  loadingUsuarios = signal<boolean>(false);
  buscaUsuario = signal<string>('');
  modalCriarUsuarioAberto = signal<boolean>(false);
  modalEditarUsuarioAberto = signal<boolean>(false);
  usuarioEmEdicao = signal<UserItem | null>(null);
  salvandoUsuario = signal<boolean>(false);
  usuarioSuccessMessage = signal<string>('');
  usuarioErrorMessage = signal<string>('');

  formCriarUsuario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['USER' as UserRole, [Validators.required]],
  });

  formEditarUsuario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['USER' as UserRole, [Validators.required]],
    password: ['', [Validators.minLength(6)]],
  });

  usuariosFiltrados = computed(() => {
    const termo = this.normalizar(this.buscaUsuario());
    const lista = this.usuarios();
    return termo
      ? lista.filter((u) => this.normalizar(u.name).includes(termo) || this.normalizar(u.email).includes(termo))
      : lista;
  });

  totalUsuarios = computed(() => this.usuarios().length);
  totalAdmins = computed(() => this.usuarios().filter((u) => u.role === 'ADMIN').length);
  totalOperadores = computed(() => this.usuarios().filter((u) => u.role === 'USER').length);

  // ───────── Gestão de Conta (E-mail e Senha) ─────────
  emailForm!: FormGroup;
  passwordForm!: FormGroup;

  loadingEmail = false;
  emailSuccessMessage = '';
  emailErrorMessage = '';

  loadingPassword = false;
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'categories' || tab === 'account' || tab === 'sectors') {
        this.activeTab.set(tab);
      } else if (tab === 'users') {
        if (this.isAdmin()) {
          this.activeTab.set('users');
        } else {
          this.activeTab.set('sectors');
        }
      }
    });

    this.carregarSetores();
    this.carregarCategorias();

    if (this.isAdmin()) {
      this.carregarUsuarios();
    }

    this.initForms();
    this.loadUserProfile();
  }

  // ───────── Métodos de Setores ─────────
  carregarSetores(): void {
    this.loadingSetores.set(true);
    this.sectorService.getSectors().subscribe({
      next: (dados) => {
        this.setores.set(dados);
        this.loadingSetores.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar setores:', err);
        this.setorErrorMessage.set('Não foi possível carregar a lista de setores.');
        this.loadingSetores.set(false);
      },
    });
  }

  abrirModalNovoSetor(): void {
    this.setorEmEdicao.set(null);
    this.nomeSetor.set('');
    this.descricaoSetor.set('');
    this.setorErrorMessage.set('');
    this.modalSetorAberto.set(true);
  }

  abrirModalEditarSetor(setor: Sector): void {
    this.setorEmEdicao.set(setor);
    this.nomeSetor.set(setor.name);
    this.descricaoSetor.set(setor.description || '');
    this.setorErrorMessage.set('');
    this.modalSetorAberto.set(true);
  }

  fecharModalSetor(): void {
    this.modalSetorAberto.set(false);
    this.setorEmEdicao.set(null);
  }

  salvarSetor(): void {
    const nome = this.nomeSetor().trim();
    if (!nome) {
      this.setorErrorMessage.set('Por favor, informe o nome do setor.');
      return;
    }

    this.salvandoSetor.set(true);
    this.setorErrorMessage.set('');

    const editando = this.setorEmEdicao();
    if (editando) {
      this.sectorService
        .updateSector(editando.id, {
          name: nome,
          description: this.descricaoSetor().trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.salvandoSetor.set(false);
            this.fecharModalSetor();
            this.setorSuccessMessage.set(`Setor "${nome}" atualizado com sucesso!`);
            this.carregarSetores();
            setTimeout(() => this.setorSuccessMessage.set(''), 4000);
          },
          error: (err) => {
            this.salvandoSetor.set(false);
            this.setorErrorMessage.set(err.error?.message || 'Erro ao atualizar setor.');
          },
        });
    } else {
      this.sectorService
        .createSector({
          name: nome,
          description: this.descricaoSetor().trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.salvandoSetor.set(false);
            this.fecharModalSetor();
            this.setorSuccessMessage.set(`Setor "${nome}" cadastrado com sucesso!`);
            this.carregarSetores();
            setTimeout(() => this.setorSuccessMessage.set(''), 4000);
          },
          error: (err) => {
            this.salvandoSetor.set(false);
            this.setorErrorMessage.set(err.error?.message || 'Erro ao cadastrar setor.');
          },
        });
    }
  }

  excluirSetor(setor: Sector): void {
    if (!confirm(`Deseja realmente excluir o setor "${setor.name}"?`)) {
      return;
    }

    this.sectorService.deleteSector(setor.id).subscribe({
      next: () => {
        this.setorSuccessMessage.set(`Setor "${setor.name}" excluído com sucesso!`);
        this.carregarSetores();
        setTimeout(() => this.setorSuccessMessage.set(''), 4000);
      },
      error: (err) => {
        console.error('Erro ao excluir setor:', err);
        this.setorErrorMessage.set(err.error?.message || 'Erro ao excluir setor.');
        setTimeout(() => this.setorErrorMessage.set(''), 5000);
      },
    });
  }

  // ───────── Métodos de Categorias ─────────
  carregarCategorias(): void {
    this.loadingCategorias.set(true);
    this.categoryService.getCategories().subscribe({
      next: (dados) => {
        this.categorias.set(dados);
        this.loadingCategorias.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.categoriaErrorMessage.set('Não foi possível carregar a lista de categorias.');
        this.loadingCategorias.set(false);
      },
    });
  }

  abrirModalNovaCategoria(): void {
    this.categoriaEmEdicao.set(null);
    this.nomeCategoria.set('');
    this.descricaoCategoria.set('');
    this.categoriaErrorMessage.set('');
    this.modalCategoriaAberto.set(true);
  }

  abrirModalEditarCategoria(cat: Category): void {
    this.categoriaEmEdicao.set(cat);
    this.nomeCategoria.set(cat.name);
    this.descricaoCategoria.set(cat.description || '');
    this.categoriaErrorMessage.set('');
    this.modalCategoriaAberto.set(true);
  }

  fecharModalCategoria(): void {
    this.modalCategoriaAberto.set(false);
    this.categoriaEmEdicao.set(null);
  }

  salvarCategoria(): void {
    const nome = this.nomeCategoria().trim();
    if (!nome) {
      this.categoriaErrorMessage.set('Por favor, informe o nome da categoria.');
      return;
    }

    this.salvandoCategoria.set(true);
    this.categoriaErrorMessage.set('');

    const editando = this.categoriaEmEdicao();
    if (editando) {
      this.categoryService
        .updateCategory(editando.id, {
          name: nome,
          description: this.descricaoCategoria().trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.salvandoCategoria.set(false);
            this.fecharModalCategoria();
            this.categoriaSuccessMessage.set(`Categoria "${nome}" atualizada com sucesso!`);
            this.carregarCategorias();
            setTimeout(() => this.categoriaSuccessMessage.set(''), 4000);
          },
          error: (err) => {
            this.salvandoCategoria.set(false);
            this.categoriaErrorMessage.set(err.error?.message || 'Erro ao atualizar categoria.');
          },
        });
    } else {
      this.categoryService
        .createCategory({
          name: nome,
          description: this.descricaoCategoria().trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.salvandoCategoria.set(false);
            this.fecharModalCategoria();
            this.categoriaSuccessMessage.set(`Categoria "${nome}" cadastrada com sucesso!`);
            this.carregarCategorias();
            setTimeout(() => this.categoriaSuccessMessage.set(''), 4000);
          },
          error: (err) => {
            this.salvandoCategoria.set(false);
            this.categoriaErrorMessage.set(err.error?.message || 'Erro ao cadastrar categoria.');
          },
        });
    }
  }

  excluirCategoria(cat: Category): void {
    if (!confirm(`Deseja realmente excluir a categoria "${cat.name}"?`)) {
      return;
    }

    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categoriaSuccessMessage.set(`Categoria "${cat.name}" excluída com sucesso!`);
        this.carregarCategorias();
        setTimeout(() => this.categoriaSuccessMessage.set(''), 4000);
      },
      error: (err) => {
        console.error('Erro ao excluir categoria:', err);
        this.categoriaErrorMessage.set(err.error?.message || 'Erro ao excluir categoria.');
        setTimeout(() => this.categoriaErrorMessage.set(''), 5000);
      },
    });
  }

  // ───────── Métodos de Gestão de Usuários (ADM) ─────────
  carregarUsuarios(): void {
    this.loadingUsuarios.set(true);
    this.usersService.getUsers().subscribe({
      next: (dados) => {
        this.usuarios.set(dados);
        this.loadingUsuarios.set(false);
      },
      error: (err) => {
        console.error('Erro ao listar usuários:', err);
        this.usuarioErrorMessage.set('Não foi possível carregar as contas de usuários.');
        this.loadingUsuarios.set(false);
      },
    });
  }

  abrirModalCriarUsuario(): void {
    this.formCriarUsuario.reset({
      name: '',
      email: '',
      password: '',
      role: 'USER',
    });
    this.usuarioErrorMessage.set('');
    this.modalCriarUsuarioAberto.set(true);
  }

  fecharModalCriarUsuario(): void {
    this.modalCriarUsuarioAberto.set(false);
  }

  salvarNovoUsuario(): void {
    if (this.formCriarUsuario.invalid) {
      this.formCriarUsuario.markAllAsTouched();
      return;
    }

    this.salvandoUsuario.set(true);
    this.usuarioErrorMessage.set('');

    const val = this.formCriarUsuario.getRawValue();
    this.usersService
      .createUser({
        name: val.name.trim(),
        email: val.email.trim(),
        password: val.password,
        role: val.role,
      })
      .subscribe({
        next: (u) => {
          this.salvandoUsuario.set(false);
          this.fecharModalCriarUsuario();
          this.usuarioSuccessMessage.set(`Usuário "${u.name}" cadastrado com sucesso!`);
          this.carregarUsuarios();
          setTimeout(() => this.usuarioSuccessMessage.set(''), 4000);
        },
        error: (err) => {
          this.salvandoUsuario.set(false);
          this.usuarioErrorMessage.set(err.error?.message || 'Erro ao cadastrar usuário.');
        },
      });
  }

  abrirModalEditarUsuario(u: UserItem): void {
    this.usuarioEmEdicao.set(u);
    this.formEditarUsuario.reset({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
    });
    this.usuarioErrorMessage.set('');
    this.modalEditarUsuarioAberto.set(true);
  }

  fecharModalEditarUsuario(): void {
    this.modalEditarUsuarioAberto.set(false);
    this.usuarioEmEdicao.set(null);
  }

  salvarEdicaoUsuario(): void {
    if (this.formEditarUsuario.invalid || !this.usuarioEmEdicao()) {
      this.formEditarUsuario.markAllAsTouched();
      return;
    }

    this.salvandoUsuario.set(true);
    this.usuarioErrorMessage.set('');

    const val = this.formEditarUsuario.value;
    const payload: { name?: string; email?: string; role?: UserRole; password?: string } = {
      name: val.name?.trim(),
      email: val.email?.trim(),
      role: val.role as UserRole,
    };

    if (val.password && val.password.trim().length >= 6) {
      payload.password = val.password.trim();
    }

    this.usersService.updateUser(this.usuarioEmEdicao()!.id, payload).subscribe({
      next: (u) => {
        this.salvandoUsuario.set(false);
        this.fecharModalEditarUsuario();
        this.usuarioSuccessMessage.set(`Usuário "${u.name}" atualizado com sucesso!`);
        this.carregarUsuarios();
        setTimeout(() => this.usuarioSuccessMessage.set(''), 4000);
      },
      error: (err) => {
        this.salvandoUsuario.set(false);
        this.usuarioErrorMessage.set(err.error?.message || 'Erro ao atualizar usuário.');
      },
    });
  }

  excluirUsuario(u: UserItem): void {
    if (this.currentUserId() === u.id) {
      alert('Você não pode excluir sua própria conta de usuário ativa.');
      return;
    }

    if (!confirm(`Deseja realmente excluir a conta do usuário "${u.name}" (${u.email})?`)) {
      return;
    }

    this.usersService.deleteUser(u.id).subscribe({
      next: () => {
        this.usuarioSuccessMessage.set(`Conta de "${u.name}" excluída com sucesso!`);
        this.carregarUsuarios();
        setTimeout(() => this.usuarioSuccessMessage.set(''), 4000);
      },
      error: (err) => {
        console.error('Erro ao excluir usuário:', err);
        this.usuarioErrorMessage.set(err.error?.message || 'Erro ao excluir usuário.');
        setTimeout(() => this.usuarioErrorMessage.set(''), 5000);
      },
    });
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // ───────── Métodos de Gestão de Conta ─────────
  private initForms(): void {
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      passwordPlain: ['', [Validators.required]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private loadUserProfile(): void {
    this.authService.profile().subscribe({
      next: (user) => {
        this.emailForm.patchValue({ newEmail: user.email });
        if (this.isAdmin() && this.usuarios().length === 0) {
          this.carregarUsuarios();
        }
      },
      error: () => {},
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  onChangeEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loadingEmail = true;
    this.emailErrorMessage = '';
    this.emailSuccessMessage = '';

    const { newEmail, passwordPlain } = this.emailForm.value;

    this.authService.changeEmail({ newEmail, passwordPlain }).subscribe({
      next: (res) => {
        this.loadingEmail = false;
        this.emailSuccessMessage = res.message || 'E-mail alterado com sucesso!';
        this.emailForm.patchValue({ passwordPlain: '' });
        this.emailForm.markAsPristine();
      },
      error: (err) => {
        this.loadingEmail = false;
        this.emailErrorMessage =
          err.error?.message || 'Erro ao alterar e-mail. Verifique sua senha.';
      },
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loadingPassword = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.loadingPassword = false;
        this.passwordSuccessMessage = res.message || 'Senha alterada com sucesso!';
        this.passwordForm.reset();
      },
      error: (err) => {
        this.loadingPassword = false;
        this.passwordErrorMessage =
          err.error?.message || 'Erro ao alterar a senha. Verifique sua senha atual.';
      },
    });
  }
}