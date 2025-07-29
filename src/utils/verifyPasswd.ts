export const verifyPasswd = (input: string, storedPassword: string): boolean => {
  // Check if the input is empty
  if (!input) {
    return false;
  }

  // Check if the stored password is empty
  if (!storedPassword) {
    return false;
  }

  // Simple comparison (sistema mantém senhas simples conforme solicitado)
  return input === storedPassword;
}