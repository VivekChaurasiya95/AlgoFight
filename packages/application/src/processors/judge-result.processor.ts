import { JudgeService } from "../judge/services/judge.service";
import { JudgeRequest } from "../judge/models/judge-request";
import { JudgeResult } from "../judge/models/judge-result";
export class JudgeResultProcessor {
  constructor(
    private readonly judgeService: JudgeService,
  ) {}

  process(request: JudgeRequest): JudgeResult {
    return this.judgeService.judge(request);
  }
}