
import { JobErrorCode } from '../failures/jobErrorCodes.js';

 export const permanentFailures = new Set<JobErrorCode>([
  JobErrorCode.INVALID_JOB_DATA,
  JobErrorCode.AUTHENTICATION_FAILED,
  JobErrorCode.AUTHORIZATION_FAILED,
]);

 export const temporaryFailures = new Set<JobErrorCode>([
  JobErrorCode.NETWORK_ERROR,
  JobErrorCode.TIMEOUT,
  JobErrorCode.SERVICE_UNAVAILABLE,
  JobErrorCode.RATE_LIMIT_EXCEEDED,
]);

