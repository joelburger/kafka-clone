import { ApiKeys, type RequestHeader, type SupportedVersion } from './types.js';

export function parseInputBuffer(input: Buffer): RequestHeader {
  //  Read message size
  const messageSize = input.readUint32BE(0);

  // Read request API key
  const apiKey: number = input.readUint16BE(4);

  // Read request API version
  const apiVersion: number = input.readUint16BE(6);

  // Read correlation ID
  const correlationId: number = input.readUInt32BE(8);

  return { messageSize, apiKey, apiVersion, correlationId };
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

export function calculateResponseBufferSize(
  supportedApiKeys: Map<ApiKeys, SupportedVersion>
): number {
  // 4 bytes: message size
  // 4 bytes: correlation ID
  // 2 bytes: error code
  // 1 byte: array length
  // For each API key: 2 (key) + 2 (min) + 2 (max) + 1 (tag) = 7 bytes
  // 4 bytes: throttle time
  // 1 byte: tag buffer
  return 4 + 4 + 2 + 1 + supportedApiKeys.size * 7 + 4 + 1;
}
