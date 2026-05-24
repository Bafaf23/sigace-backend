import bcrypt from "bcryptjs";

export function hashPassword(password: string): string {
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log(`Contraseña hashed: ${hashedPassword}`);
  return hashedPassword;
}

hashPassword("Baarb.jk23");