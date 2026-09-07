/*
  Warnings:

  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schools` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `roles`;

-- DropTable
DROP TABLE `schools`;

-- CreateTable
CREATE TABLE `School` (
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
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `cdceId` INTEGER NOT NULL,

    UNIQUE INDEX `School_SIG_key`(`SIG`),
    UNIQUE INDEX `School_cdceId_key`(`cdceId`),
    PRIMARY KEY (`SIG`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cdcee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `School` ADD CONSTRAINT `School_cdceId_fkey` FOREIGN KEY (`cdceId`) REFERENCES `Cdcee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
