import * as net from 'net';

const HOST: string = '127.0.0.1';
const PORT: number = parseInt(process.env.PORT || '9092', 10);

function parseInputBuffer(input: Buffer) {
  //  Read message size
  const messageSize = input.readUint32BE(0);

  // Read request API key
  const requestApiKey: number = input.readUint16BE(4);

  // Read request API version
  const requestApiVersion: number = input.readUint16BE(6);

  // Read correlation ID
  const correlationId: number = input.readUInt32BE(8);

  return { messageSize, requestApiKey, requestApiVersion, correlationId };
}

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on('data', (input: Buffer) => {
    console.log('Input buffer ', input);

    const { correlationId } = parseInputBuffer(input);

    // Construct output buffer
    const output: Buffer = Buffer.alloc(8);

    // Write message size
    output.writeUint32BE(0);

    // Write correlation ID
    output.writeUint32BE(correlationId, 4);

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
