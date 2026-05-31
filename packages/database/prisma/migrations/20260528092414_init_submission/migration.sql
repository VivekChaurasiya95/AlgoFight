-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('CREATED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'STALE');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'CREATED',
    "stdout" TEXT,
    "stderr" TEXT,
    "executionTime" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
