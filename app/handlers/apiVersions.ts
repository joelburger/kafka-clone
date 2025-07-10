import net from 'net';
import { supportedApiKeys } from '../global.js';
import { ApiKeys, type SupportedVersion } from '../types.js';

function writeSupportedApiVersions(
  supportedApiKeys: Map<ApiKeys, SupportedVersion>,
  output: Buffer,
  offset: number
): number {
  let newOffset: number = offset;

  // Write array length (1 byte). Adding 1 when serialising.
  // The length of the API Versions array + 1, encoded as a varint.
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

function calculateApiVersionsBufferSize(
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

export function handleApiVersions(
  connection: net.Socket,
  correlationId: number,
  body: Buffer
) {
  const totalBufferSize = calculateApiVersionsBufferSize(supportedApiKeys);
  const output: Buffer = Buffer.alloc(totalBufferSize);

  let offset = 0;

  // Write message size (4 bytes). This is the total buffer size minus the first 4 bytes allocated for the message size.
  output.writeUInt32BE(totalBufferSize - 4);
  offset += 4;

  // Write correlation ID (4 bytes)
  output.writeUInt32BE(correlationId, offset);
  offset += 4;

  // Write error code (2 bytes)
  output.writeUInt16BE(0, offset);
  offset += 2;

  // Write API versions
  offset = writeSupportedApiVersions(supportedApiKeys, output, offset);

  // Write throttle time (4 bytes)
  output.writeUInt32BE(0, offset);
  offset += 4;

  // Write tag buffer (1 byte)
  output.writeUInt8(0, offset);

  connection.write(output);
}
