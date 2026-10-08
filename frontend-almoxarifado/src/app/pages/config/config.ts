import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  selector: 'app-config',
  styleUrl: './config.css',
  templateUrl: './config.html',
})
export class Config implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  emailForm!: FormGroup;
  passwordForm!: FormGroup;

  // Estados do formulário de e-mail
  loadingEmail = false;
  emailSuccessMessage = '';
  emailErrorMessage = '';

  // Estados do formulário de senha
  loadingPassword = false;
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  private initForms(): void {
    // Formulário de alteração de e-mail
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      passwordPlain: ['', [Validators.required]],
    });

    // Formulário de alteração de senha
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // Preenche o campo de e-mail com o e-mail atual do usuário
  private loadUserProfile(): void {
    this.authService.profile().subscribe({
      next: (user) => {
        this.emailForm.patchValue({ newEmail: user.email });
      },
      error: () => {
        // Falha silenciosa ou tratamento adicional
      },
    });
  }

  // Validador customizado para conferir se as duas senhas novas são iguais
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