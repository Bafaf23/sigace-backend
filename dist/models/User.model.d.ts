import type { RowDataPacket } from "mysql2";
export interface UserListItem {
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    numeroDeTelefono: string;
    rol: number;
    SIG: string;
}
interface UserRow extends RowDataPacket, UserListItem {
}
export declare class User {
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    numeroDeTelefono: string;
    rol: string;
    password: string;
    SIG: string;
    constructor(cedula: string, nombre: string, apellido: string, email: string, numeroDeTelefono: string, rol: string, password: string, SIG: string);
    static getUsers(): Promise<UserListItem[]>;
    static createUser(user: User): Promise<boolean>;
    static getUserByEmail(email: string): Promise<UserRow | null>;
}
export {};
//# sourceMappingURL=User.model.d.ts.map