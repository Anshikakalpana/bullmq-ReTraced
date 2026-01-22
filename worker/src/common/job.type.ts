import { JobErrorCode } from "./failures/jobErrorCodes.js";

export type Job = {
  jobId: string;

  createdAt: number;
  updatedAt?: number;

  jobData: JobData;

  queueName: string;

  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'dead'
    | 'delayed'
    | 'poisoned';

  tries: number;
  maxTries: number;
  
  lastError?: JobError;


  type?: string;
  priority?: number;
  runAt?: number;
  
  historyNeed: boolean;
  history?: History[];

  backoffConfig: BackoffConfig;
  backoffStrategy?: 'exponential' | 'fixed' | 'threeTier' | 'linear';
};

export type JobError = {
  code: JobErrorCode;
  message: string;
  stack?: string;
  failedAt: number;
};

export type JobResult<T = unknown> = {
  success: boolean;
  output?: T;
  error?: JobError;
  finishedAt: number;
};

export type JobData = {
      
};

export type History = {
  error: JobError;
  attemptedAt: number;
  trigger: 'AUTO' | 'MANUAL';
  changesMade: boolean;
  result: 'SUCCESS' | 'FAILED' | 'PENDING';
};

export type BackoffConfig = {
  baseDelaySeconds: number;
  maxDelaySeconds: number;
  factor: number;
  jitterSeconds?: number;
  limitOfTries: number;
};
