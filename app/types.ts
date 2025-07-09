// Shared type definitions for API request/response handling

export interface RequestHeader {
  messageSize: number;
  apiKey: number;
  apiVersion: number;
  correlationId: number;
}

export interface SupportedVersion {
  minVersion: number;
  maxVersion: number;
}

export enum ApiKeys {
  API_VERSIONS = 18,
  DESCRIBE_TOPIC_PARTITIONS = 75,
}
