// Validações usando Zod
import { z } from 'zod';

// Schema de validação para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .min(1, 'E-mail é obrigatório'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória'),
  lembrar: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Schema de validação para cadastro
export const registerSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('E-mail inválido')
    .min(1, 'E-mail é obrigatório'),
  senha: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Schema de validação para resetar senha
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .min(1, 'E-mail é obrigatório'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

