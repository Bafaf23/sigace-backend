-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `SIG` VARCHAR(10) NOT NULL,
    `representative_id` INTEGER NOT NULL,
    `tuition_number` VARCHAR(255) NOT NULL,
    `allergies` TEXT NULL,
    `medical_condition` TEXT NULL,
    `weight` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `shirt_size` VARCHAR(50) NOT NULL,
    `pants_size` VARCHAR(50) NOT NULL,
    `shoe_size` VARCHAR(50) NOT NULL,
    `gender` ENUM('M', 'F') NOT NULL DEFAULT 'M',
    `birth_date` DATE NOT NULL,
    `condition` ENUM('regular', 'Nuevo Ingreso', 'retirado', 'repitiente') NOT NULL DEFAULT 'Nuevo Ingreso',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `students_id_user_key`(`id_user`),
    UNIQUE INDEX `students_tuition_number_key`(`tuition_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `representatives` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `document` VARCHAR(15) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `relationship` VARCHAR(50) NOT NULL,
    `repEmail` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `representatives_document_key`(`document`),
    UNIQUE INDEX `representatives_repEmail_key`(`repEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_SIG_fkey` FOREIGN KEY (`SIG`) REFERENCES `schools`(`SIG`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_representative_id_fkey` FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
