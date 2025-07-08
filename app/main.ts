import * as net from 'net';

const HOST: string = '127.0.0.1';
const PORT: number = parseInt(process.env.PORT || '9092', 10);

interface RequestHeader {
  messageSize: number;
  apiKey: number;
  apiVersion: number;
  correlationId: number;
}

function parseInputBuffer(input: Buffer): RequestHeader {
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

function validateApiVersion(apiKey: number, apiVersion: number): boolean {
  return apiKey === 18 && apiVersion >= 0 && apiVersion <= 4;
}

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on('data', (input: Buffer) => {
    console.log('Input buffer ', input);

    const { correlationId, apiKey, apiVersion } = parseInputBuffer(input);

    const errorCode = validateApiVersion(apiKey, apiVersion) ? 0 : 35;

    // Construct output buffer
    const output: Buffer = Buffer.alloc(10);

    // Write message size
    output.writeUint32BE(0);

    // Write correlation ID
    output.writeUint32BE(correlationId, 4);

    // Write error code
    output.writeUint16BE(errorCode, 8);

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
