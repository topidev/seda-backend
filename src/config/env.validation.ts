import { plainToInstance } from 'class-transformer'
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
}

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string

  @IsString()
  JWT_SECRET: string

  @IsString()
  JWT_EXPIRES_IN: string

  @IsString()
  JWT_REFRESH_SECRET: string

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string

  @IsString()
  GOOGLE_CLIENT_ID: string

  @IsString()
  GOOGLE_CLIENT_SECRET: string

  @IsString()
  GOOGLE_CALLBACK_URL: string

  @IsNumber()
  PORT: number

  @IsEnum(Environment)
  NODE_ENV: Environment

  @IsString()
  FRONTEND_URL: string
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}