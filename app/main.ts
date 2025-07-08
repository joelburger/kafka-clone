import net from 'net';

console.log('Logs from your program will appear here!');

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection

  connection.on('data', (data: Buffer) => {
    console.log('Received data: ', data);

    const buffer: Buffer = Buffer.alloc(8);
    buffer.writeUint32BE(0);
    buffer.writeUint32BE(7, 4);
    console.log('Buffer', buffer);

    connection.write(buffer);
  });

  connection.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(9092, '127.0.0.1');
