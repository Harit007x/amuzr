import { Server } from 'socket.io';
import * as prisma from '@repo/db';
import { Redis, RedisOptions } from 'ioredis';
import 'dotenv/config';

function isRedisOptions(config: RedisOptions | string): config is RedisOptions {
  return typeof config !== 'string';
}

function createRedisClient(config: RedisOptions | string): Redis {
  if (isRedisOptions(config)) {
    return new Redis(config);
  }
  return new Redis(config);
}

let redisConfig: RedisOptions | string;

if (process.env.REDIS_URL) {
  // If a full Redis URL is provided, use it directly
  redisConfig = process.env.REDIS_URL;
} else {
  // Otherwise, use individual parameters
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

const pub = createRedisClient(redisConfig);
const sub = createRedisClient(redisConfig);
class SocketService {
  private _io: Server;
  constructor() {
    this._io = new Server({
      cors: {
        allowedHeaders: ['*'],
        origin: ['http://localhost:3000'],
      },
    });
    sub.subscribe('MESSAGES');
    sub.subscribe('QUESTIONS');
    sub.subscribe('QUESTION-ACTION');
  }

  public eventListeners() {
    const io = this._io;
    const { db } = prisma;
    io.on('connection', (socket) => {
      console.log('connected user');

      socket.on('message', async (message: string, meeting_id: string, user_id: number) => {
        console.log('message event =', message, meeting_id, user_id);
        let new_message = null;

        if (new_message) {
          await pub.publish('MESSAGES', JSON.stringify({ meeting_id, message: new_message }));
        }
      });

      socket.on('joinRoom', (room_id: string) => {
        console.log('joined room =', room_id);
        socket.join(room_id);
      });

      socket.on('disconnect', () => {
        console.log('disconnected');
      });
    });

  }

  get io() {
    return this._io;
  }
}

export default SocketService;
