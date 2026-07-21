/*
  Warnings:

  - You are about to drop the `shared_links` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "shared_links" DROP CONSTRAINT "shared_links_teacherId_fkey";

-- DropTable
DROP TABLE "shared_links";

-- DropEnum
DROP TYPE "SharedLinkType";
