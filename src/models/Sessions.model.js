export class Sessions {
  constructor(name, SIG) {
    this.name = name;
    this.SIG = SIG;
  }

  static async createSession(session) {
    let db;
    try {
      db = await connectToDatabase();
      await db.query("INSERT INTO sessions (name, SIG) VALUES (?, ?)", [
        session.name,
        session.SIG,
      ]);
    } catch (error) {
      console.error("Error al crear la sesión:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async getSession(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query("SELECT * FROM sessions WHERE SIG = ?", [
        SIG,
      ]);
      return rows;
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
