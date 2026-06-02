import { prisma } from "../client/prisma";
import {
    SubmissionRepository,
    SubmissionResult,
} from "../contracts/submission.repository";
import { SubmissionStatus } from "@algofight/types";
import {canTransition} from "@algofight/state-machine";


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
    const submission = 
      await this.getSubmissionById(
        submissionId,
      );
    if(!submission) {
      throw new Error (
        `Submission ${submissionId} was not found!.`
      )
    }

    if(
      !canTransition(
        submission.status as SubmissionStatus,
        status,
      )
    ){
      throw new Error(
        `Invalid status transition: ${submission.status} -> ${status}.`
      )
    }

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

    await this.updateStatus(
      submissionId,
      result.status,
    )

    return prisma.submission.update({
      where: {
        id: submissionId,
      },

      data: {
        status: result.status,

        stdout: result.stdout,

        stderr: result.stderr,

        executionTime: result.executionTime,

        exitCode: result.exitCode,
      },
    });
  }
  async getSubmissionById(submissionId: string){
    return prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
    });
  }

  async getAllSubmission() {
    return prisma.submission.findMany();
  }
}