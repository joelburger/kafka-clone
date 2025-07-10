import { type Request } from './types.js';

export function parseRequest(input: Buffer): Request {
  let offset = 0;

  //  Read message size
  const messageSize = input.readUInt32BE(offset);
  offset += 4;

  // Read request API key
  const apiKey: number = input.readUInt16BE(offset);
  offset += 2;

  // Read request API version
  const apiVersion: number = input.readUInt16BE(offset);
  offset += 2;

  // Read correlation ID
  const correlationId: number = input.readUInt32BE(offset);
  offset += 4;

  // Read client ID length
  const clientIdLength: number = input.readUInt16BE(offset);
  offset += 2;

  // Read client ID
  const clientId: string = input
    .subarray(offset, offset + clientIdLength)
    .toString();
  offset += clientIdLength;

  // Skip tag buffer
  offset += 1;

  // Read body
  const body: Buffer = input.subarray(offset);

  return { messageSize, apiKey, apiVersion, correlationId, clientId, body };
}
