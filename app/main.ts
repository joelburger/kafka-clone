import * as net from 'net';
import { parseRequest } from './bufferUtils.js';
import { HOST, PORT, supportedApiKeys } from './global.js';
import { handleUnsupportedVersion } from './handlers/unsupportedVersion.js';

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
    const { correlationId, apiKey, apiVersion, body } = parseRequest(input);

    if (!validateApiVersion(apiKey, apiVersion)) {
      handleUnsupportedVersion(connection, correlationId);
      return;
    }

    const api = supportedApiKeys.get(apiKey)!;
    api.handler(connection, correlationId, body);
  });

  connection.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, HOST);
console.log(`Listening on port ${PORT}`);
