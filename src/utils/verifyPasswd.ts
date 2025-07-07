import bcrypt from 'bcryptjs';

export const verifyPasswd = (input: string, storedHash: string): boolean => {
  // Check if the input is empty
  if (!input) {
    return false;
  }

    // Check if the stored hash is empty
    if (!storedHash) {
      return false;
    }

  // Compare the input with the stored hash
  return bcrypt.compareSync(input, storedHash);
}