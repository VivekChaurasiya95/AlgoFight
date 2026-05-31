import { prisma } from "../client/prisma";
import {
    SubmissionRepository,
    SubmissionResult,
} from "../contracts/submission.repository";
import { SubmissionStatus } from "@algofight/types";

export class PrismaSubmissionRepository  implements SubmissionRepository{

  async createSubmission() {
    return prisma.submission.create({
      data: {
        language: "typescript",

        code: "console.log('Hello World');",
      },
    });
  }

  async updateStatus(
    submissionId: string,
    status: SubmissionStatus,
  ) {

    return prisma.submission.update({
      where: {
        id: submissionId,
      },

      data: {
        status,
      },
    });
  }

  async completeSubmission(
    submissionId: string,
    result: SubmissionResult,
  ) {

    return prisma.submission.update({
      where: {
        id: submissionId,
      },

      data: {
        status: SubmissionStatus.COMPLETED,

        stdout: result.stdout,

        executionTime: result.executionTime,
      },
    });
  }

  async getAllSubmission() {
    return prisma.submission.findMany();
  }
}