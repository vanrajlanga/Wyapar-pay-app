import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Validate critical environment variables to prevent weak/default secrets
 * This runs before the app starts to catch configuration issues early
 */
function validateEnvironmentSecrets() {
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

  const weakSecrets = [
    'your-super-secret',
    'CHANGE_ME',
    'change-this',
    'password',
    '123456',
    'secret',
    'test',
  ];

  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];

    // Check if variable exists
    if (!value) {
      errors.push(`❌ Missing required environment variable: ${envVar}`);
      continue;
    }

    // In production, enforce minimum length
    if (isProduction && value.length < 32) {
      errors.push(
        `❌ ${envVar} is too weak (${value.length} chars). Must be at least 32 characters in production.`
      );
    }

    // Check for weak/default values
    const hasWeakSecret = weakSecrets.some((weak) =>
      value.toLowerCase().includes(weak.toLowerCase())
    );
    if (hasWeakSecret) {
      errors.push(
        `❌ ${envVar} contains a default/weak value. Please generate a strong secret.`
      );
    }
  }

  // Production-specific validations
  if (isProduction) {
    // Ensure database password is not empty
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.length < 8) {
      errors.push(
        `❌ DB_PASSWORD must be set and at least 8 characters in production.`
      );
    }

    // Warn about important optional secrets
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn(
        '⚠️  WARNING: AWS credentials not set. Email and file upload features will not work.'
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn(
        '⚠️  WARNING: Razorpay credentials not set. Payment features will not work.'
      );
    }
  }

  // If there are errors, stop the app
  if (errors.length > 0) {
    console.error('\n' + '='.repeat(80));
    console.error('🔴 ENVIRONMENT CONFIGURATION ERRORS');
    console.error('='.repeat(80));
    errors.forEach((error) => console.error(error));
    console.error('='.repeat(80));
    console.error('\n💡 How to fix:');
    console.error(
      "1. Generate strong secrets: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
    console.error('2. Update your .env file with the generated secrets');
    console.error('3. Never use default/example secrets in production\n');
    process.exit(1);
  }

  // Success message
  if (isProduction) {
    console.log('✅ Environment secrets validation passed');
  }
}

async function bootstrap() {
  // Validate critical environment variables before starting the app
  validateEnvironmentSecrets();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security middleware with enhanced configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })
  );

  // Additional custom security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );
    next();
  });

  app.use(compression());

  // CORS configuration with proper origin validation
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  // In production, ALLOWED_ORIGINS must be set
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error(
      'ALLOWED_ORIGINS must be set in production. Example: ALLOWED_ORIGINS=https://app.wyaparpay.com,https://www.wyaparpay.com'
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow localhost/127.0.0.1
      if (process.env.NODE_ENV !== 'production') {
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.includes('10.')
        ) {
          return callback(null, true);
        }
      }

      // Check against whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log rejected origins for debugging
      console.warn(`⚠️  CORS: Rejected request from origin: ${origin}`);
      // Return false instead of throwing error to avoid 500 status
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-Id'],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Global exception filter (must be registered before pipes)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('WyaparPay API')
    .setDescription('Mobile Business App API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('='.repeat(60));
  console.log('🚀 WyaparPay Backend Server Started Successfully!');
  console.log('='.repeat(60));
  console.log(`📍 Server URL: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔧 Health Check: http://localhost:${port}/api/v1/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🗄️ Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_DATABASE || 'wyapar_pay'}`
  );
  console.log(
    `⚡ Redis: ${process.env.REDIS_ENABLED === 'true' ? 'Enabled' : 'Disabled (using in-memory alternatives)'}`
  );
  console.log('='.repeat(60));
}

bootstrap();
