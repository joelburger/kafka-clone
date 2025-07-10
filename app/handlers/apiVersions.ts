import net from 'net';
import { writeSupportedApiVersions } from '../bufferUtils.js';
import { supportedApiKeys } from '../global.js';
import { ApiKeys, type SupportedVersion } from '../types.js';

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
  output.writeUint32BE(totalBufferSize - 4);
  offset += 4;

  // Write correlation ID (4 bytes)
  output.writeUint32BE(correlationId, offset);
  offset += 4;

  // Write error code (2 bytes)
  output.writeUInt16BE(0, offset);
  offset += 2;

  // Write API versions
  offset = writeSupportedApiVersions(supportedApiKeys, output, offset);

  // Write throttle time (4 bytes)
  output.writeUint32BE(0, offset);
  offset += 4;

  // Write tag buffer (1 byte)
  output.writeUInt8(0, offset);

  connection.write(output);
}
