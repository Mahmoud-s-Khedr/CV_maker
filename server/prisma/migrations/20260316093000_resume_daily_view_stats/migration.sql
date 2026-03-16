CREATE TABLE "ResumeDailyViewStat" (
    "resumeId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ResumeDailyViewStat_pkey" PRIMARY KEY ("resumeId", "day")
);

CREATE INDEX "ResumeDailyViewStat_day_idx" ON "ResumeDailyViewStat"("day");

ALTER TABLE "ResumeDailyViewStat"
ADD CONSTRAINT "ResumeDailyViewStat_resumeId_fkey"
FOREIGN KEY ("resumeId") REFERENCES "Resume"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
