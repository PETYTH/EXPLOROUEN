import 'express';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      REDIS_URL?: string;
      RESEND_API_KEY?: string;
      FROM_EMAIL?: string;
      FRONTEND_URL?: string;
      MONGODB_URL?: string;
      MAILTRAP_USER?: string;
      MAILTRAP_PASS?: string;
      MAILTRAP_HOST?: string;
      EMAIL_PROVIDER?: 'resend' | 'mailtrap';
    }
  }
}

export interface EmailServiceConfig {
  apiKey: string;
  from: string;
  provider: string;
  mailtrapUser: string;
  mailtrapPass: string;
  mailtrapHost: string;
}

export interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  mongodb: {
    url: string;
  };
  redisUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  bcryptRounds: number;
  corsOrigin: string;
  emailService: EmailServiceConfig;
  uploadMaxSize: number;
  allowedImageTypes: string[];
  rateLimits: {
    general: { windowMs: number; max: number };
    auth: { windowMs: number; max: number };
    upload: { windowMs: number; max: number };
  };
}
