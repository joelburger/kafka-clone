import { Socket } from 'net';

export interface Request {
  messageSize: number;
  apiKey: number;
  apiVersion: number;
  correlationId: number;
  clientId: string;
  body: Buffer;
}

export interface SupportedVersion {
  minVersion: number;
  maxVersion: number;
  handler: (connection: Socket, correlationId: number, body?: Buffer) => void;
}

export enum ApiKeys {
  API_VERSIONS = 18,
  DESCRIBE_TOPIC_PARTITIONS = 75,
}

export enum ErrorCodes {
  UNKNOWN_TOPIC_OR_PARTITION = 3,
  UNSUPPORTED_VERSION = 35,
}
