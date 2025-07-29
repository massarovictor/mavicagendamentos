import bcrypt from 'bcryptjs';

/**
 * Configurações de segurança para hash de senhas
 */
const SALT_ROUNDS = 12; // Aumentado para maior segurança
const MIN_PASSWORD_LENGTH = 6;

/**
 * Cria hash da senha com salt robusto
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error('Erro ao criptografar senha');
  }
};

/**
 * Verifica senha contra hash armazenado
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return false;
  }
};

/**
 * Versão síncrona para compatibilidade com código existente
 */
export const verifyPasswordSync = (password: string, hash: string): boolean => {
  if (!password || !hash) {
    return false;
  }
  
  try {
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    return false;
  }
};

/**
 * Gera senha temporária segura
 */
export const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Valida força da senha
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  
  if (password.length > 50) {
    errors.push('Senha não pode ter mais de 50 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  // Verificar senhas comuns
  const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Senha muito comum, escolha uma mais segura');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 