import "express-session";

declare module "express-session" {
  interface SessionData {
    user: {
      token: string;
      id: number;
      dni: string;
      email: string;
      name: string;
      lastName: string;
      phone: string;
      role: string;
      SIG: string;
    };
  }
}
