-- CreateTable
CREATE TABLE `academic_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    `SIG` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `academic_periods_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `academic_periods` ADD CONSTRAINT `academic_periods_SIG_fkey` FOREIGN KEY (`SIG`) REFERENCES `school`(`SIG`) ON DELETE RESTRICT ON UPDATE CASCADE;
