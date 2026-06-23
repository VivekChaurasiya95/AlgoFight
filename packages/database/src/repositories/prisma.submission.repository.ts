import { prisma } from "../client/prisma";
import {
    SubmissionRepository,
    SubmissionResult,
} from "../contracts/submission.repository";
import { SubmissionStatus } from "@algofight/types";
import {canTransition} from "@algofight/state-machine";
import {
  InvalidTransitionError,
  SubmissionNotFoundError
} from "@algofight/error-handling";

import { toSubmissionEntity } from "../mappers/submission.mapper";

import { CreateSubmissionInput } from "../contracts/submission.repository";


export class PrismaSubmissionRepository  implements SubmissionRepository{



  async incrementRetryCount(
    submissionId: string,
  ){
    return prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    });
  }

  async markAsStale(
    submissionId: string,
  ){
    return this.updateStatus(
      submissionId,
      SubmissionStatus.STALE,
    )
  }

  async getStaleSubmissions(
    thresholdMs: number,
  ): Promise <string[]>{
    const thresholdDate = new Date(
      Date.now() - thresholdMs,
    );

    const submissions = await prisma.submission.findMany({
      where: {
        status: SubmissionStatus.PROCESSING,

        updatedAt: {
          lt: thresholdDate,
        }
      },
      select: {
        id: true,
      }
    });
    return submissions.map(
      submission => submission.id,
    )
  }

  async findById(
    submissionId: string,
  ){
    return prisma.submission.findUnique({
      where: {
        id: submissionId,
      }
    })
  }
    
  
  
  async createSubmission(
    input: CreateSubmissionInput
  ) {

    const submission =
      await prisma.submission.create({
        data: {
          userId: input.userId,

          problemId: input.problemId,
          
          language: input.language,
          
          code: input.code,
        },
      });

    return toSubmissionEntity(
      submission,
    )
  }

  private async validateTransition (
    submissionId: string,
    nextStatus: SubmissionStatus,
  ){
    const submission = 
      await this.getSubmissionById(
        submissionId,
      );
    if(!submission) {
      throw new SubmissionNotFoundError (
        submissionId,
      )
    }

    if(
      !canTransition(
        submission.status,
        nextStatus,
      )
    ){
      throw new InvalidTransitionError(
        submission.status,
        nextStatus,
      )
    };
  }
  async updateStatus(
    submissionId: string,
    status: SubmissionStatus,
  ) {
    await this.validateTransition(
      submissionId,
      status,
    );

    const submission =
      await prisma.submission.update({
        where: {
          id: submissionId,
        },

        data: {
          status,
        },
      });

    return toSubmissionEntity(
      submission,
    );
  }

  async completeSubmission(
    submissionId: string,
    result: SubmissionResult,
  ) {

    await this.validateTransition(
      submissionId,
      result.status,
    )

    const submission = 
      await prisma.submission.update({
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

    return toSubmissionEntity(
      submission,
    )
  }
  async getSubmissionById(
  submissionId: string,
  ) {
    const submission =
      await prisma.submission.findUnique({
        where: {
          id: submissionId,
        },
      });

    if (!submission) {
      return null;
    }

    return toSubmissionEntity(
      submission,
    );
  }

  async getAllSubmission() {
    const submission =
      await prisma.submission.findMany();
    return submission.map(
      toSubmissionEntity,
    );
  }
}