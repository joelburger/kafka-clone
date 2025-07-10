import net from 'net';
import { ErrorCodes } from '../types.js';

export function handleUnsupportedVersion(
  connection: net.Socket,
  correlationId: number,
  body: Buffer
) {
  const output: Buffer = Buffer.alloc(10);
  let offset = 0;
  output.writeUint32BE(6);
  offset += 4;

  // Write correlation ID (4 bytes)
  output.writeUint32BE(correlationId, offset);
  offset += 4;

  // Write error code (2 bytes)
  output.writeUInt16BE(ErrorCodes.UNSUPPORTED_VERSION, offset);
  offset += 2;

  connection.write(output);
}
