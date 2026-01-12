
export const getQueueKeys = (queueName: string) => ({
  ready: queueName,
  delayed: `${queueName}:delayed`,
  processing: `${queueName}:processing`,
  dlq: `${queueName}:dlq`,
  processingZset: `${queueName}:processing:zset`,
});
