/*
  Warnings:

  - You are about to drop the column `nama` on the `cdcee` table. All the data in the column will be lost.
  - You are about to drop the `school` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `academic_periods` DROP FOREIGN KEY `academic_periods_SIG_fkey`;

-- DropForeignKey
ALTER TABLE `school` DROP FOREIGN KEY `School_cdceId_fkey`;

-- DropForeignKey
ALTER TABLE `school` DROP FOREIGN KEY `school_director_id_fkey`;

-- DropIndex
DROP INDEX `academic_periods_SIG_fkey` ON `academic_periods`;

-- AlterTable
ALTER TABLE `academic_periods` MODIFY `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `cdcee` DROP COLUMN `nama`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT 'Sin Nombre';

-- AlterTable
ALTER TABLE `users` MODIFY `is_first_login` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `is_active` BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE `school`;

-- CreateTable
CREATE TABLE `schools` (
    `SIG` VARCHAR(191) NOT NULL,
    `school_name` VARCHAR(191) NOT NULL,
    `type` ENUM('Privada', 'Publica') NOT NULL,
    `company_name` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `municipality` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `DEA_CODE` VARCHAR(191) NOT NULL,
    `RIF` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cdceId` INTEGER NOT NULL,
    `director_id` INTEGER NULL,

    UNIQUE INDEX `schools_director_id_key`(`director_id`),
    PRIMARY KEY (`SIG`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `schools` ADD CONSTRAINT `School_cdceId_fkey` FOREIGN KEY (`cdceId`) REFERENCES `cdcee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schools` ADD CONSTRAINT `schools_director_id_fkey` FOREIGN KEY (`director_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_periods` ADD CONSTRAINT `academic_periods_SIG_fkey` FOREIGN KEY (`SIG`) REFERENCES `schools`(`SIG`) ON DELETE RESTRICT ON UPDATE CASCADE;
