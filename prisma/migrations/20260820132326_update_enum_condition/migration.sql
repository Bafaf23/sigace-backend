/*
  Warnings:

  - You are about to alter the column `status` on the `enrollments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `enrollments` MODIFY `status` ENUM('activo', 'aprobado', 'retirado', 'materia pendiente', 'reprobado', 'pre-inscrito') NOT NULL DEFAULT 'activo';
