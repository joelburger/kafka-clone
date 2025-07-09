import * as net from 'net';
import { ApiKeys, type RequestHeader, type SupportedVersion } from './types.js';
import {
  calculateResponseBufferSize,
  parseInputBuffer,
  writeSupportedApiVersions,
} from './bufferUtils.js';

const HOST: string = '127.0.0.1';
const PORT: number = parseInt(process.env.PORT || '9092', 10);

const supportedApiKeys = new Map<ApiKeys, SupportedVersion>([
  [ApiKeys.DESCRIBE_TOPIC_PARTITIONS, { minVersion: 0, maxVersion: 0 }],
  [ApiKeys.API_VERSIONS, { minVersion: 0, maxVersion: 4 }],
]);

function validateApiVersion(apiKey: number, apiVersion: number): boolean {
  if (!supportedApiKeys.has(apiKey)) {
    return false;
  }

  const supportedApiKey = supportedApiKeys.get(apiKey)!;
  const { minVersion, maxVersion } = supportedApiKey;

  return apiVersion >= minVersion && apiVersion <= maxVersion;
}

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on('data', (input: Buffer) => {
    console.log('Input buffer ', input);

    const { correlationId, apiKey, apiVersion } = parseInputBuffer(input);

    const errorCode = validateApiVersion(apiKey, apiVersion) ? 0 : 35;

    // Construct output buffer

    const totalBufferSize = calculateResponseBufferSize(supportedApiKeys);

    console.log('Buffer size', totalBufferSize);

    const output: Buffer = Buffer.alloc(totalBufferSize);

    let offset = 0;

    // Write message size (4 bytes). This is the total buffer size minus the 4 bytes allocated for the message size.
    const messageSize = totalBufferSize - 4;

    output.writeUint32BE(messageSize);
    offset += 4;

    // Write correlation ID (4 bytes)
    output.writeUint32BE(correlationId, offset);
    offset += 4;

    // Write error code (2 bytes)
    output.writeUInt16BE(errorCode, offset);
    offset += 2;

    // Write API versions
    offset = writeSupportedApiVersions(supportedApiKeys, output, offset);

    // Write throttle time (4 bytes)
    output.writeUint32BE(0, offset);
    offset += 4;

    // Write tag buffer (1 byte)
    output.writeUInt8(0, offset);

    console.log('Output buffer', output);

    // Write response to client
    connection.write(output);
  });

  connection.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, HOST);
console.log(`Listening on port ${PORT}`);
