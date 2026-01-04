import { JobErrorCode } from "./failures/jobErrorCodes.js";
export  type job = {
  jobId: string,

  createdAt: number,
  updatedAt?: number,

  jobData: jobData,

  queueName: string,

  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead'| 'delayed',

  tries: number,
  maxTries: number,

  lastError?: string,
  deadReason?: string,

  type?: string,
  priority?: number,
  runAt?: number

  
};




export type JobError = {
  code: JobErrorCode;
  message: string;
  stack?: string;
  failedAt: number;
};




export type JobResult = {
  success: boolean;
  output?: any;
  error?: JobError;
  finishedAt: number;
};



export type jobData = {
  emailFrom: string;
  emailTo: string;
  subject: string;
  body: string;
  template?: string;
  attachments?: string[];

}

export type delay={
  retryAfterSeconds: number,
  limitOfTries: number
}