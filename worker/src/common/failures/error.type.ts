
import { JobErrorCode } from './jobErrorCodes';

 const permanentFailures = new Set<JobErrorCode>([
  JobErrorCode.INVALID_JOB_DATA,
  JobErrorCode.AUTHENTICATION_FAILED,
  JobErrorCode.AUTHORIZATION_FAILED,
]);

 const temporaryFailures = new Set<JobErrorCode>([
  JobErrorCode.NETWORK_ERROR,
  JobErrorCode.TIMEOUT,
  JobErrorCode.SERVICE_UNAVAILABLE,
  JobErrorCode.RATE_LIMIT_EXCEEDED,
]);

export const jobFailureType = {
 permanentFailures ,
  temporaryFailures
};