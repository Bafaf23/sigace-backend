export class Teachers {
  constructor(id, id_user, SIG, is_active) {
    this.id = id;
    this.id_user = id_user;
    this.SIG = SIG;
    this.is_active = is_active;
  }

  static async createTeacher(teacher) {}
}
