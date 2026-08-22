import { prisma } from "../client/prisma";
import {
  SubmissionRepository,
  SubmissionResult,
  CreateSubmissionInput,
} from "../contracts/submission.repository";
import { SubmissionStatus } from "@algofight/types";
import { canTransition } from "@algofight/state-machine";
import {
  InvalidTransitionError,
  SubmissionNotFoundError,
} from "@algofight/error-handling";
import { toSubmissionEntity } from "../mappers/submission.mapper";
import { SubmissionEntity } from "../entities/submission.entity";

export class PrismaSubmissionRepository implements SubmissionRepository {
  async incrementRetryCount(submissionId: string) {
    return prisma.submission.update({
      where: { id: submissionId },
      data: { retryCount: { increment: 1 } },
    });
  }

  async markAsStale(submissionId: string) {
    return this.updateStatus(submissionId, SubmissionStatus.STALE);
  }

  async getStaleSubmissions(thresholdMs: number): Promise<string[]> {
    const thresholdDate = new Date(Date.now() - thresholdMs);
    const submissions = await prisma.submission.findMany({
      where: {
        status: SubmissionStatus.PROCESSING,
        updatedAt: { lt: thresholdDate },
      },
      select: { id: true },
    });
    return submissions.map((s) => s.id);
  }

  async findById(submissionId: string) {
    return prisma.submission.findUnique({
      where: { id: submissionId },
    });
  }

  async createSubmission(input: CreateSubmissionInput) {
    const submission = await prisma.submission.create({
      data: {
        userId: input.userId,
        problemId: input.problemId,
        roomId: input.roomId, // ðŸ‘ˆ Persist roomId
        language: input.language,
        code: input.code,
      },
    });
    return toSubmissionEntity(submission);
  }

  private async validateTransition(submissionId: string, nextStatus: SubmissionStatus) {
    const submission = await this.getSubmissionById(submissionId);
    if (!submission) {
      throw new SubmissionNotFoundError(submissionId);
    }
    if (!canTransition(submission.status, nextStatus)) {
      throw new InvalidTransitionError(submission.status, nextStatus);
    }
  }

  async updateStatus(submissionId: string, status: SubmissionStatus) {
    await this.validateTransition(submissionId, status);
    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { status },
    });
    return toSubmissionEntity(submission);
  }

  async completeSubmission(
    submissionId: string,
    result: SubmissionResult
  ): Promise<SubmissionEntity> {
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTime: result.executionTime,
        exitCode: result.exitCode,

        // --- 1. SAVE THE AGGREGATE METRICS ---
        verdict: result.verdict as any,
        cpuUsage: result.cpuUsage,
        memoryUsage: result.memoryUsage,
        compileTime: result.compileTime,
      },
    });

    // ... (leave the rest of your method mapping to SubmissionEntity as is)
    return toSubmissionEntity(updated);
    // Or however it currently returns
  }


  async getSubmissionById(submissionId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) return null;
    return toSubmissionEntity(submission);
  }

  async getAllSubmission() {
    const submissions = await prisma.submission.findMany();
    return submissions.map(toSubmissionEntity);
  }
}

