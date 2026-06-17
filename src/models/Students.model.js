import { connectToDatabase, closeDatabaseConnection } from "../db.js";

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
    status,
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
    this.status = status;
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
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
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
      
      -- 🌟 LA MAGIA ESTÁ AQUÍ: El filtro de id_period se ejecuta DENTRO del JOIN, no en el WHERE
      LEFT JOIN enrollments en ON students.id = en.id_student AND en.id_period = ?
      
      LEFT JOIN sections sec ON en.id_section = sec.id
      LEFT JOIN years yer ON sec.id_year = yer.id

      -- El WHERE solo se encarga de asegurar que pertenezcan a tu escuela
      WHERE students.SIG = ?
      
      -- Ordenamos: Primero los que NO tienen año asignado en este periodo, luego por año y apellido
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
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async createStudent(student) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO students (id_user, gender, SIG, representative_id, tuition_number, allergies, medical_condition, weight, height, shirt_size, pants_size, shoe_size, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
          student.status,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear el estudiante:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * @description Actualiza un estudiante por su ID
   * @param {string} id
   * @param {Object} student
   * @returns {boolean}
   */
  static async updateStudent(id, student) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "UPDATE students SET gender = ?, birth_date = ?, height = ?, allergies = ?, medical_condition = ?, weight = ?, shirt_size = ?, pants_size = ?, shoe_size = ?, status = ? WHERE id = ?",
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
          student.status,
          id,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar el estudiante:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
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
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        "SELECT u.name, u.last_name, u.document, s.id FROM students s INNER JOIN users u ON s.id_user = u.id LEFT JOIN enrollments e ON s.id = e.id_student AND e.id_period = ? WHERE e.id IS NULL AND s.SIG = ?",
        [id_period, SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes no matriculados:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
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
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
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
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Busca a un estudiante por su ID
   * @param {number} id_student - id del estudiante
   * @return {object|null} - info del estudiante o null si no existe
   */
  static async getStudentByID(id_student) {
    // 1. Quitamos SIG de los parámetros de la función si no lo usas
    let db = null;
    try {
      db = await connectToDatabase();

      const sql = `
      SELECT 
        st.id,
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
        st.height,
        st.shirt_size,
        st.pants_size,
        st.shoe_size,
        st.gender,
        en.status,
        sc.name AS section_name, 
        y.name AS year_name
      FROM students st
      INNER JOIN users u ON st.id_user = u.id
      INNER JOIN enrollments en ON st.id = en.id_student
      INNER JOIN sections sc ON en.id_section = sc.id
      INNER JOIN years y ON sc.id_year = y.id
      WHERE st.id = ? 

      AND en.id = (
      SELECT MAX(id) 
      FROM enrollments 
      WHERE id_student = st.id
      )

      LIMIT 1
    `;

      // 2. Le pasamos ÚNICAMENTE el id_student para que calce con el único '?'
      const [rows] = await db.query(sql, [Number(id_student)]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.log(`Error en getStudentByID: ${error}`);
      return null;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Recupera todo el récord académico del estudiante y lo agrupa por períodos lectivos,
   * calculando la nota acumulativa por lapso en base al plan de evaluación real de su sección.
   * @param {number|string} id_student - ID del estudiante
   */
  static async getRecordStudent(id_student) {
    let db;
    try {
      db = await connectToDatabase();

      // SQL corregido al 100%: Filtra materias y notas limitándose estrictamente al periodo y sección inscrita
      const sql = `
        SELECT 
          en.id AS enrollment_id,
          ap.name AS school_year,
          y.name AS year_level,
          sc.name AS section,
          sb.name AS subject_name,
          lap.name AS lapse_name,
          g.grade,
          epd.porcentage
        FROM enrollments en
        INNER JOIN sections sc ON en.id_section = sc.id
        INNER JOIN years y ON sc.id_year = y.id
        INNER JOIN academic_periods ap ON en.id_period = ap.id
        -- Unimos con la carga académica programada únicamente para la sección y periodo del alumno
        INNER JOIN load_academic la ON la.id_section = en.id_section AND la.id_period = en.id_period
        INNER JOIN subjects sb ON la.id_subject = sb.code_subject
        -- Traemos el plan de evaluación de lapsos correspondiente de forma segura
        LEFT JOIN evaluation_plans ep ON ep.id_load_academic = la.id
        LEFT JOIN lapses lap ON ep.id_lapse = lap.id
        LEFT JOIN evaluation_plan_details epd ON epd.id_evaluation_plan = ep.id
        -- Hacemos left join de las notas del estudiante restringiendo a la evaluación correspondiente
        LEFT JOIN grades g ON g.id_evaluation = epd.id AND g.id_student = en.id_student
        WHERE en.id_student = ?
        ORDER BY ap.start_date DESC, sb.name ASC, lap.id ASC
      `;

      const [rows] = await db.query(sql, [id_student]);

      // Si no hay inscripciones, retornamos un arreglo vacío
      if (!rows || rows.length === 0) {
        return [];
      }

      // Helper para identificar de forma segura el número de lapso desde la base de datos
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

        // Inicializamos el periodo lectivo de inscripción si no existe en el mapa
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
                1: [],
                2: [],
                3: [],
              },
            };
          }

          const subjectObj = periodsMap[enrollmentId].subjectsMap[subjectName];
          const lapseNum = parseLapseNumber(row.lapse_name);

          // Si la evaluación posee una nota cargada y un lapso válido, la añadimos al set de cálculos
          if (
            lapseNum &&
            lapseNum >= 1 &&
            lapseNum <= 3 &&
            row.grade !== null
          ) {
            subjectObj.lapsesEvaluations[lapseNum].push({
              grade: parseFloat(row.grade),
              percentage: parseFloat(row.porcentage || 0),
            });
          }
        }
      }

      // =========================================================================
      // CÁLCULO DE NOTAS ACUMULATIVAS DEL PERIODO (ESCALA 0 A 20)
      // =========================================================================
      for (const enrollmentId in periodsMap) {
        const subjectsMap = periodsMap[enrollmentId].subjectsMap;
        const subjectsList = [];

        for (const subName in subjectsMap) {
          const sub = subjectsMap[subName];
          const finalSubjectObj = {
            subject_name: sub.subject_name,
            lap_1: null,
            lap_2: null,
            lap_3: null,
            final_grade: null,
          };

          // Calculamos la nota acumulada de cada uno de los 3 lapsos reglamentarios
          for (let l = 1; l <= 3; l++) {
            const evals = sub.lapsesEvaluations[l];
            if (evals && evals.length > 0) {
              let accumulatedGrade = 0;
              let totalPercent = 0;

              evals.forEach((ev) => {
                accumulatedGrade += (ev.grade * ev.percentage) / 100;
                totalPercent += ev.percentage;
              });

              // Si el docente cargó notas pero el plan no está al 100% todavía,
              // proyectamos proporcionalmente para no perjudicar la nota acumulada del alumno
              if (totalPercent > 0 && totalPercent < 100) {
                accumulatedGrade = (accumulatedGrade / totalPercent) * 100;
              }

              // Redondeamos la nota del lapso a la escala oficial venezolana (0 al 20)
              finalSubjectObj[`lap_${l}`] = Math.round(accumulatedGrade);
            }
          }

          // Calculamos la nota definitiva del año escolar basándonos en los lapsos culminados
          const l1 = finalSubjectObj.lap_1;
          const l2 = finalSubjectObj.lap_2;
          const l3 = finalSubjectObj.lap_3;

          let lapseCount = 0;
          let sumLapses = 0;

          if (l1 !== null) {
            sumLapses += l1;
            lapseCount++;
          }
          if (l2 !== null) {
            sumLapses += l2;
            lapseCount++;
          }
          if (l3 !== null) {
            sumLapses += l3;
            lapseCount++;
          }

          finalSubjectObj.final_grade =
            lapseCount > 0 ? Math.round(sumLapses / lapseCount) : null;
          subjectsList.push(finalSubjectObj);
        }

        periodsMap[enrollmentId].subjects = subjectsList;
        delete periodsMap[enrollmentId].subjectsMap;
      }

      // Retornamos el array de periodos académicos ordenados cronológicamente
      return Object.values(periodsMap);
    } catch (error) {
      console.error("❌ Error en modelo Students.getRecordStudent:", error);
      throw error;
    }
  }
}
