import { connectToDatabase } from "../db.js";
import bcrypt from "bcryptjs";
export class User {
    cedula;
    nombre;
    apellido;
    email;
    numeroDeTelefono;
    rol;
    password;
    SIG;
    constructor(cedula, nombre, apellido, email, numeroDeTelefono, rol, password, SIG) {
        this.cedula = cedula;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.numeroDeTelefono = numeroDeTelefono;
        this.rol = rol;
        this.password = password;
        this.SIG = SIG;
        this.cedula = cedula;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.numeroDeTelefono = numeroDeTelefono;
        this.rol = rol;
        this.password = password;
        this.SIG = SIG;
    }
    static async getUsers() {
        try {
            const db = await connectToDatabase();
            const [users] = await db.query("SELECT cedula, nombre, apellido, email, numero_de_telefono AS numeroDeTelefono, rol_id AS rol, SIG FROM usuarios");
            return users.map(({ cedula, nombre, apellido, email, numeroDeTelefono, rol, SIG }) => ({
                cedula,
                nombre,
                apellido,
                email,
                numeroDeTelefono,
                rol,
                SIG,
            }));
        }
        catch (error) {
            console.error("Error al obtener usuarios:", error);
            throw error;
        }
    }
    static async createUser(user) {
        try {
            const db = await connectToDatabase();
            const [result] = await db.query("INSERT INTO usuarios (cedula, nombre, apellido, email, numero_de_telefono, rol_id, SIG, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                user.cedula,
                user.nombre,
                user.apellido,
                user.email,
                user.numeroDeTelefono,
                user.rol,
                user.SIG,
                await bcrypt.hash(user.password, 10),
            ]);
            return true;
        }
        catch (error) {
            console.error("Error al crear usuario:", error);
            return false;
        }
    }
    static async getUserByEmail(email) {
        try {
            const db = await connectToDatabase();
            const [result] = await db.query("SELECT cedula, nombre, apellido, email, numero_de_telefono AS numeroDeTelefono, rol_id AS rol, SIG, contraseña FROM usuarios WHERE email = ?", [email]);
            return result[0] || null;
        }
        catch (error) {
            console.error("Error al obtener usuario por email:", error);
            return null;
        }
    }
}
//# sourceMappingURL=User.model.js.map