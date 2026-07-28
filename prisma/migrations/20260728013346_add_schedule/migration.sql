-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "subjectTermGroupId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subjectTermGroupId_fkey" FOREIGN KEY ("subjectTermGroupId") REFERENCES "subject_term_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
