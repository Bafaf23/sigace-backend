import { pool } from "../db.js";

/**
 * @class Student
 * @description Modelo de estudiante
 * @param {number} id - ID del estudiante
 * @param {number} id_user - ID del usuario
 * @param {string} SIG - SIG del estudiante
 * @param {number} representative_id - ID del representante
 * @param {string} tuition_number - Número de matrícula
 * @param {number} year_id - ID del año
 * @param {number} session_id - ID de la sesión
 * @param {string} allergies - Alergias del estudiante
 * @param {string} medical_condition - Condición médica del estudiante
 * @param {number} weight - Peso del estudiante
 * @param {number} height - Altura del estudiante
 * @param {string} shirt_size - Talla de camisa del estudiante
 * @param {string} pants_size - Talla de pantalón del estudiante
 * @param {string} shoe_size - Talla de zapato del estudiante
 * @param {string} status - Estado del estudiante
 * @param {string} created_at - Fecha de creación del estudiante
 * @param {string} updated_at - Fecha de actualización del estudiante
 * @param {string} gender - Género del estudiante
 */
export class Students {
  constructor(
    id,
    id_user,
    gender,
    SIG,
    representative_id,
    tuition_number,
    year_id,
    id_section,
    id_period,
    allergies,
    medical_condition,
    weight,
    height,
    shirt_size,
    pants_size,
    shoe_size,
    condition,
    created_at,
    updated_at,
  ) {
    this.id = id;
    this.gender = gender;
    this.id_user = id_user;
    this.SIG = SIG;
    this.representative_id = representative_id;
    this.tuition_number = tuition_number;
    this.year_id = year_id;
    this.id_section = id_section;
    this.id_period = id_period;
    this.allergies = allergies;
    this.medical_condition = medical_condition;
    this.weight = weight;
    this.height = height;
    this.shirt_size = shirt_size;
    this.pants_size = pants_size;
    this.shoe_size = shoe_size;
    this.condition = condition;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Obtiene a todos los estudiantes matriculados en un periodo específico,
   * sin importar si ya tienen año o sección asignados en su matrícula.
   * @param {object} param
   * @param {string} param.SIG - código único del colegio
   * @param {number} param.id_period - id del período académico
   * @returns {Promise<Array<object>>}
   */
  static async getAllStudents({ SIG, id_period }) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          students.id, 
          students.id_user, 
          students.gender, 
          students.SIG, 
          students.representative_id, 
          students.tuition_number, 
          students.birth_date, 
          users.name, 
          users.last_name, 
          users.email, 
          users.phone, 
          users.document, 
          representatives.name AS representative_name, 
          representatives.last_name AS representative_last_name,
          representatives.phone AS representative_phone, 
          representatives.relationship AS representative_relationship,
          representatives.document AS representative_document, 
          representatives.repEmail AS representative_repEmail, 
          en.id_section,
          students.condition, 
          en.status AS enrollment_status,
          sec.name AS section, 
          yer.id AS id_year,
          yer.name AS year 
      FROM students 
      INNER JOIN users ON students.id_user = users.id 
      LEFT JOIN representatives ON students.representative_id = representatives.id
      
      -- Subconsulta que captura la matrícula prioritaria (Pre-inscrito > Inscrito > Activo)
      LEFT JOIN enrollments en ON en.id = (
          SELECT id 
          FROM enrollments 
          WHERE id_student = students.id AND id_period = ?
          ORDER BY FIELD(status, 'Pre-inscrito', 'Inscrito', 'Activo') DESC, id DESC
          LIMIT 1
      )
      -- Conexión directa a la sección vinculada a la matrícula obtenida
      LEFT JOIN sections sec ON en.id_section = sec.id
      -- Conexión directa para extraer el año real de esa sección pre-inscrita o activa
      LEFT JOIN years yer ON sec.id_year = yer.id 

      WHERE students.SIG = ?
      
      ORDER BY 
          (yer.id IS NULL) DESC, 
          yer.id ASC, 
          sec.name ASC, 
          users.last_name ASC;`,
        [id_period, SIG],
      );
      return rows;
    } catch (error) {
      console.error("❌ Error al obtener los estudiantes:", error);
      throw error;
    }
  }

  static async createStudent(student) {
    try {
      const [result] = await pool.query(
        "INSERT INTO students (id_user, gender, SIG, representative_id, tuition_number, allergies, medical_condition, weight, height, shirt_size, pants_size, shoe_size, \`condition\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          student.id_user,
          student.gender,
          student.SIG,
          student.representative_id,
          student.tuition_number,
          student.allergies,
          student.medical_condition,
          student.weight,
          student.height,
          student.shirt_size,
          student.pants_size,
          student.shoe_size,
          student.condition,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear el estudiante:", error);
      throw error;
    }
  }

  /**
   * @description Actualiza un estudiante por su ID
   * @param {string} id
   * @param {Object} student
   * @returns {boolean}
   */
  static async updateStudent(id, student) {
    try {
      const [result] = await pool.query(
        "UPDATE students SET gender = ?, birth_date = ?, height = ?, allergies = ?, medical_condition = ?, weight = ?, shirt_size = ?, pants_size = ?, shoe_size = ? WHERE id = ?",
        [
          student.gender,
          student.birth_date,
          student.height,
          student.allergies,
          student.medical_condition,
          student.weight,
          student.shirt_size,
          student.pants_size,
          student.shoe_size,
          id,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar el estudiante:", error);
      throw error;
    }
  }
  /**
   * Obtiene los estudiantes no matriculados
   * @param {object} params - Objecto con los parámetros
   * @param {number} params.id_period - ID del periodo
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Array<object>} - Array de estudiantes no matriculados
   */
  static async getStudentNotEnrolled({ id_period, SIG }) {
    try {
      const [rows] = await pool.query(
        "SELECT u.name, u.last_name, u.document, s.id FROM students s INNER JOIN users u ON s.id_user = u.id LEFT JOIN enrollments e ON s.id = e.id_student AND e.id_period = ? WHERE e.id IS NULL AND s.SIG = ?",
        [id_period, SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes no matriculados:", error);
      throw error;
    }
  }

  /**
   * Obtiene a los estudiates de una sección
   * @param {object} params - Objecto con los parámetros
   * @param {number} params.id_section - ID de la sección
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Array<object>} - Array de estudiantes
   */
  static async getStudentsBySection({ id_section, SIG }) {
    try {
      const [rows] = await pool.query(
        `SELECT 
    s.id, 
    s.id_user, 
    s.SIG, 
    s.tuition_number, 
    u.name, 
    u.last_name, 
    u.document 
FROM students s 
INNER JOIN users u ON s.id_user = u.id  
INNER JOIN enrollments e ON s.id = e.id_student
WHERE e.id_section = ? AND s.SIG = ?`,
        [id_section, SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes de la sección:", error);
      throw error;
    }
  }

  /**
   * Busca a un estudiante por su ID
   * @param {number} id_student - id del estudiante
   * @return {object|null} - info del estudiante o null si no existe
   */
  static async getStudentByID(id_student, id_period) {
    try {
      const sql = `
      SELECT 
        st.id AS id_student,
        u.id AS id_user,
        u.name , 
        u.last_name, 
        u.document,
        u.phone,
        u.email,
        st.birth_date,
        st.tuition_number,
        st.allergies,
        st.medical_condition,
        st.weight,
        st.condition,
        st.SIG, 
        st.created_at AS date_enrollment,
        st.height,
        st.shirt_size,
        st.pants_size,
        st.shoe_size,
        st.gender,
        en.status,
        ye.name AS name_year,
        sec.name AS name_section
      FROM students st
      INNER JOIN users u ON st.id_user = u.id
      LEFT JOIN enrollments en ON en.id_student = st.id AND en.id_period = ?
      LEFT JOIN sections sec ON sec.id = en.id_section
      LEFT JOIN years ye ON ye.id = sec.id_year
      WHERE st.id = ? 

      LIMIT 1
    `;
      const [rows] = await pool.query(sql, [id_period, id_student]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.log(`Error en getStudentByID: ${error}`);
      return null;
    }
  }

  /**
   ** Recupera todo el récord académico del estudiante y lo agrupa por períodos lectivos,
   * calculando la nota acumulativa por lapso en base al plan de evaluación real de su sección.
   * @param {number|string} id_student - ID del estudiante
   * @param {number|string} id_period - ID del periodo
   */
  static async getRecordStudent(id_student, id_period) {
    try {
      const sql = `
        SELECT 
        en.id AS enrollment_id,
        ap.name AS school_year,
        y.name AS year_level,
        sc.name AS section,
        sb.name AS subject_name,
        lap.name AS lapse_name,
        CONCAT(epd.activity, ': ', epd.referent_teorical) AS evaluation_name, 
        g.grade,
        epd.porcentage
      FROM enrollments en
      INNER JOIN sections sc ON en.id_section = sc.id
      INNER JOIN years y ON sc.id_year = y.id
      INNER JOIN academic_periods ap ON en.id_period = ap.id
      INNER JOIN load_academic la ON la.id_section = en.id_section AND la.id_period = en.id_period
      INNER JOIN subjects sb ON la.id_subject = sb.code_subject
      LEFT JOIN evaluation_plans ep ON ep.id_load_academic = la.id
      LEFT JOIN lapses lap ON ep.id_lapse = lap.id
      LEFT JOIN evaluation_plan_details epd ON epd.id_evaluation_plan = ep.id
      LEFT JOIN grades g ON g.id_evaluation = epd.id AND g.id_student = en.id_student
      WHERE en.id_student = ? AND en.id_period = ?
      ORDER BY ap.start_date DESC, sb.name ASC, lap.id ASC LIMIT 100
      `;

      const [rows] = await pool.query(sql, [id_student, id_period]);

      if (!rows || rows.length === 0) {
        return [];
      }

      const parseLapseNumber = (name) => {
        if (!name) return null;
        const normalized = name.toString().toLowerCase();
        if (
          normalized.includes("1") ||
          (normalized.includes("i") &&
            !normalized.includes("ii") &&
            !normalized.includes("iii"))
        )
          return 1;
        if (
          normalized.includes("2") ||
          (normalized.includes("ii") && !normalized.includes("iii"))
        )
          return 2;
        if (normalized.includes("3") || normalized.includes("iii")) return 3;
        const match = normalized.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      };

      const periodsMap = {};

      for (const row of rows) {
        const enrollmentId = row.enrollment_id;

        if (!periodsMap[enrollmentId]) {
          periodsMap[enrollmentId] = {
            school_year: row.school_year,
            year_level: row.year_level,
            section: row.section,
            subjectsMap: {},
          };
        }

        const subjectName = row.subject_name;
        if (subjectName) {
          if (!periodsMap[enrollmentId].subjectsMap[subjectName]) {
            periodsMap[enrollmentId].subjectsMap[subjectName] = {
              subject_name: subjectName,
              lapsesEvaluations: {
                1: { grade: null, evaluations: [] },
                2: { grade: null, evaluations: [] },
                3: { grade: null, evaluations: [] },
              },
            };
          }

          const subjectObj = periodsMap[enrollmentId].subjectsMap[subjectName];
          const lapseNum = parseLapseNumber(row.lapse_name);

          if (lapseNum && lapseNum >= 1 && lapseNum <= 3) {
            // Guardamos las evaluaciones individuales para los desplegables de la UI
            if (row.evaluation_name) {
              subjectObj.lapsesEvaluations[lapseNum].evaluations.push({
                name: row.evaluation_name,
                grade: row.grade !== null ? parseFloat(row.grade) : 0,
                percentage: parseFloat(row.porcentage || 0),
              });
            }
          }
        }
      }

      // Procesamiento y estructuración del resultado final
      for (const enrollmentId in periodsMap) {
        const subjectsMap = periodsMap[enrollmentId].subjectsMap;
        const subjectsList = [];

        for (const subName in subjectsMap) {
          const sub = subjectsMap[subName];

          const finalSubjectObj = {
            subject_name: sub.subject_name,
            final_grade: null,
            lapses: [],
          };

          let sumLapses = 0;
          let lapseCount = 0;

          for (let l = 1; l <= 3; l++) {
            const lapseData = sub.lapsesEvaluations[l];
            let accumulatedGrade = 0;
            let totalPercent = 0;
            let hasGrades = false;

            if (lapseData.evaluations.length > 0) {
              lapseData.evaluations.forEach((ev) => {
                accumulatedGrade += (ev.grade * ev.percentage) / 100;
                totalPercent += ev.percentage;
                hasGrades = true;
              });

              if (totalPercent > 0 && totalPercent < 100) {
                accumulatedGrade = (accumulatedGrade / totalPercent) * 100;
              }
            }

            const finalLapseGrade = hasGrades
              ? Math.round(accumulatedGrade)
              : null;

            if (finalLapseGrade !== null) {
              sumLapses += finalLapseGrade;
              lapseCount++;
            }

            // Estructura idéntica a la que consume tu componente React original
            finalSubjectObj.lapses.push({
              number: l,
              grade: finalLapseGrade,
              evaluations: lapseData.evaluations, // Detalle de exámenes incluido
            });
          }

          finalSubjectObj.final_grade =
            lapseCount > 0 ? Math.round(sumLapses / lapseCount) : null;
          subjectsList.push(finalSubjectObj);
        }

        periodsMap[enrollmentId].subjects = subjectsList;
        delete periodsMap[enrollmentId].subjectsMap;
      }

      return Object.values(periodsMap);
    } catch (error) {
      console.error("❌ Error en modelo Students.getRecordStudent:", error);
      throw error;
    }
  }

  /**
   ** Recupera a todos los estudiantes que no tienen una seccion
   * @param {string} SIG - codigo del colegio
   * @param {number} id_period - codigo del perido en cursor
   * @returns {Array<object>} - lista de estudiantes
   */
  static async getPreinscription(SIG, id_period) {
    
    try {
     

      const sql = `SELECT u.name, u.last_name, u.document, s.id FROM students s INNER JOIN users u ON s.id_user = u.id LEFT JOIN enrollments e ON s.id = e.id_student AND e.id_period = ? WHERE e.id_section IS NULL AND s.SIG = ? `;

      const studentn = await pool.query(sql, [id_period, SIG]);

      return studentn;
    } catch (error) {
      throw error;
    }
  }
}
