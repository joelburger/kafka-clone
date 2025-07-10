import net from 'net';
import { ErrorCodes } from '../types.js';

function readTopics(body: Buffer) {
  let offset = 0;
  // The length of the topics array + 1, encoded as a varint. Subtracting 1 when deserialising.
  const topicsLength = body.readUInt8(offset) - 1;
  offset += 1;

  const topics: string[] = [];

  for (let i = 0; i < topicsLength; i++) {
    // The topic name encoded as a COMPACT_STRING, which starts with a varint corresponding to the length of the string + 1,
    // followed by the string itself encoded in UTF-8.
    const topicNameLength: number = body.readUInt8(offset) - 1;
    offset += 1;

    const topicName: string = body
      .subarray(offset, offset + topicNameLength)
      .toString();
    offset += topicNameLength;

    // Skip tag buffer
    offset += 1;

    topics.push(topicName);
  }

  return topics;
}

function calculateBufferSize(topics: string[]): number {
  // Fixed header: 4 (message size) + 4 (correlationId) + 1 (tag) + 4 (throttle time) + 1 (topic array length)
  let size = 4 + 4 + 1 + 4 + 1;

  // Per-topic: 2 (error code) + 1 (topic name length) + topicNamByteLength + 16 (UUID) + 1 (is internal) + 1 (partitions array) + 4 (operations) + 1 (tag)
  for (const topicName of topics) {
    size += 2 + 1 + Buffer.byteLength(topicName) + 16 + 1 + 1 + 4 + 1;
  }

  // Next cursor (1) + tag buffer (1)
  size += 1 + 1;

  return size;
}

export function handleDescribeTopicPartitions(
  connection: net.Socket,
  correlationId: number,
  body: Buffer
) {
  const topics: string[] = readTopics(body);

  const totalBufferSize = calculateBufferSize(topics);
  const output: Buffer = Buffer.alloc(totalBufferSize);
  let offset = 0;

  /// Write message size (4 bytes). This is the total buffer size minus the first 4 bytes allocated for the message size.
  output.writeUInt32BE(totalBufferSize - 4, offset);
  offset += 4;

  // Write correlation ID (4 bytes)
  output.writeUInt32BE(correlationId, offset);
  offset += 4;

  // Write tag buffer
  output.writeUInt8(0, offset);
  offset += 1;

  // Write throttle time
  output.writeUInt32BE(0, offset);
  offset += 4;

  // Write topic array length. The length of the topics array + 1, encoded as a varint. Adding 1 when serialising.
  output.writeUInt8(topics.length + 1, offset);
  offset += 1;

  topics.forEach((topicName) => {
    // Write error code (2 bytes)
    output.writeUInt16BE(ErrorCodes.UNKNOWN_TOPIC_OR_PARTITION, offset);
    offset += 2;

    // Write topic name length
    // The topic name encoded as a COMPACT_STRING, which starts with a varint corresponding to the length of the string + 1,
    // followed by the string itself encoded in UTF-8. Adding 1 when serialising.
    const nameLength = Buffer.byteLength(topicName);
    output.writeUInt8(nameLength + 1, offset);
    offset += 1;

    // Write topic name
    output.write(topicName, offset, nameLength, 'utf8');
    offset += nameLength;

    // Write topic ID (UUID, 16 bytes)
    Buffer.alloc(16, 0).copy(output, offset);
    offset += 16;

    // Write is internal flag
    output.writeUInt8(0, offset);
    offset += 1;

    // Write partitions array
    output.writeUInt8(1, offset);
    offset += 1;

    // Write a 4-byte integer (bitfield) representing the authorized operations for this topic.
    const operationsBuffer: Buffer = Buffer.from([0x00, 0x00, 0x0d, 0xf8]);
    operationsBuffer.copy(output, offset);
    offset += 4;

    // Write tag buffer
    output.writeUInt8(0, offset);
    offset += 1;
  });

  // Write next cursor
  output.writeUInt8(0xff, offset);
  offset += 1;

  // Write tag buffer
  output.writeUInt8(0, offset);
  offset += 1;

  console.log(output);

  connection.write(output);
}
