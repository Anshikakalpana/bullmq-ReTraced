import { JobErrorCode } from "../common/failures/jobErrorCodes";

export type dlq = {


  jobId: string;
  queueName: string;

  jobData: unknown; // immutable snapshot

  status: 'dead' | 'poisoned';

  failureType?: 'TEMPORARY' | 'PERMANENT' | 'POISON';

  maxTries: number;
  actualTries: number;

  lastError: JobError;

  retries?: DLQRetryAttempt[];

  createdAt: number;
  updatedAt?: number;

  deadReason?: string;

  priority?: number;
  runAt?: number;


};




export type JobError = {
  code: JobErrorCode;
  message: string;
  stack?: string;
  failedAt: number;
};




export type DLQRetryAttempt = {


  attemptedAt: number;

  trigger: 'MANUAL' | 'AUTO';

  changesMade: boolean;

  changesInJob?: string;

  result: 'FAILED' | 'SUCCESS';

  error?: JobError;
};
