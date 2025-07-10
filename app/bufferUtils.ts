import { ApiKeys, type Request, type SupportedVersion } from './types.js';

export function parseRequest(input: Buffer): Request {
  let offset = 0;

  //  Read message size
  const messageSize = input.readUint32BE(offset);
  offset += 4;

  // Read request API key
  const apiKey: number = input.readUint16BE(offset);
  offset += 2;

  // Read request API version
  const apiVersion: number = input.readUint16BE(offset);
  offset += 2;

  // Read correlation ID
  const correlationId: number = input.readUInt32BE(offset);
  offset += 4;

  // Read client ID length
  const clientIdLength: number = input.readUint16BE(offset);
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

export function writeSupportedApiVersions(
  supportedApiKeys: Map<ApiKeys, SupportedVersion>,
  output: Buffer,
  offset: number
): number {
  let newOffset: number = offset;

  // Write array length (1 byte). The length of the API Versions array + 1, encoded as a varint.
  output.writeUInt8(supportedApiKeys.size + 1, newOffset);
  newOffset += 1;

  // Loop through entries
  supportedApiKeys.entries().forEach((entry) => {
    const [key, supportedVersion] = entry;

    // Write api key (2 bytes)
    output.writeUInt16BE(key, newOffset);
    newOffset += 2;

    // Write minimum version (2 bytes)
    output.writeUInt16BE(supportedVersion.minVersion, newOffset);
    newOffset += 2;

    // Write maximum version (2 bytes)
    output.writeUInt16BE(supportedVersion.maxVersion, newOffset);
    newOffset += 2;

    // Write tag buffer (1 byte)
    output.writeUInt8(0, newOffset);
    newOffset += 1;
  });

  return newOffset;
}
