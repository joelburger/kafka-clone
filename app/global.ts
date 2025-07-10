import { ApiKeys, type SupportedVersion } from './types.js';
import { handleApiVersions } from './handlers/apiVersions.js';
import { handleDescribeTopicPartitions } from './handlers/describeTopicPartitions.js';

export const HOST: string = '127.0.0.1';
export const PORT: number = parseInt(process.env.PORT || '9092', 10);

export const supportedApiKeys = new Map<ApiKeys, SupportedVersion>([
  [
    ApiKeys.DESCRIBE_TOPIC_PARTITIONS,
    { minVersion: 0, maxVersion: 0, handler: handleDescribeTopicPartitions },
  ],
  [
    ApiKeys.API_VERSIONS,
    { minVersion: 0, maxVersion: 4, handler: handleApiVersions },
  ],
]);
