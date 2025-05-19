import Redis from 'ioredis';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  generateDriveKey(type: 'folder' | 'contents', id: string): string {
    return `drive:${type}:${id}`;
  }

  async invalidateDriveCache(folderId: string): Promise<void> {
    const keys = [
      this.generateDriveKey('folder', folderId),
      this.generateDriveKey('contents', folderId)
    ];
    await Promise.all(keys.map(key => this.del(key)));
  }
}
