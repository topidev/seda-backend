/*
  Warnings:

  - You are about to drop the column `subjectTermGroupId` on the `activities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[activityId,studentId,subjectTermGroupId]` on the table `grades` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subjectId` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectTermGroupId` to the `grades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_subjectTermGroupId_fkey";

-- DropIndex
DROP INDEX "grades_activityId_studentId_key";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "subjectTermGroupId",
ADD COLUMN     "subjectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "grades" ADD COLUMN     "subjectTermGroupId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "grades_activityId_studentId_subjectTermGroupId_key" ON "grades"("activityId", "studentId", "subjectTermGroupId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subjectTermGroupId_fkey" FOREIGN KEY ("subjectTermGroupId") REFERENCES "subject_term_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
