import { job, JobResult } from "../common/job.type.js";
import { JobErrorCode } from "../common/failures/jobErrorCodes.js";

const jobHandler = async (job: job): Promise<JobResult> => {

  const testCase = job.jobData.subject; // using subject to control test

  switch (testCase) {

  
    case "SUCCESS":
      return {
        success: true,
        output: { sent: true },
        finishedAt: Date.now()
      };

 
    case "NETWORK_ERROR":
      return {
        success: false,
        error: {
          code: JobErrorCode.NETWORK_ERROR,
          message: "Simulated network issue",
          failedAt: Date.now()
        },
        finishedAt: Date.now()
      };

    case "TIMEOUT":
      return {
        success: false,
        error: {
          code: JobErrorCode.TIMEOUT,
          message: "Simulated timeout",
          failedAt: Date.now()
        },
        finishedAt: Date.now()
      };

 
    case "INVALID_JOB_DATA":
      return {
        success: false,
        error: {
          code: JobErrorCode.INVALID_JOB_DATA,
          message: "Invalid payload",
          failedAt: Date.now()
        },
        finishedAt: Date.now()
      };

    case "AUTH_FAILED":
      return {
        success: false,
        error: {
          code: JobErrorCode.AUTHENTICATION_FAILED,
          message: "Auth failure",
          failedAt: Date.now()
        },
        finishedAt: Date.now()
      };


    case "CRASH":
      throw new Error("Simulated worker crash");

  
    default:
      return {
        success: false,
        error: {
          code: JobErrorCode.UNKNOWN_ERROR,
          message: "Unknown test case",
          failedAt: Date.now()
        },
        finishedAt: Date.now()
      };
  }
};

export default jobHandler;
