import { z } from 'zod';

// -----------------------------CONSTANTS----------------------------------- //

const str = z.string();
const port = z.coerce.number();
const num = z.coerce.number();

// -----------------------------SCHEMAS----------------------------------- //

export const NodeConfigSchema = z.object({
  NODE_ENV: z.enum(['production', 'development']),
});

export const AppConfigSchema = z.object({
  APP_HTTP_PORT: port.default(3000),
});

export const CookieConfigSchema = z.object({
  COOKIE_SECRET: str,
});

export const PostgresConfigSchema = z.object({
  POSTGRES_HOST: str,
  POSTGRES_USER: str,
  POSTGRES_PASSWORD: str,
  POSTGRES_DB: str,
  POSTGRES_PORT: port,
});

export const JwtConfigSchema = z.object({
  JWT_ISSUER: str,
  JWT_SECRET: str,
  JWT_EXPIRES_IN: str,
});

export const RpcProviderConfigSchema = z.object({
  ETH_MAINNET_RPC_PROVIDER_URL: str,
  SEPOLIA_RPC_PROVIDER_URL: str,
  POLYGON_MAINNET_RPC_PROVIDER_URL: str,
  ARBITRUM_MAINNET_RPC_PROVIDER_URL: str,
  OPTIMISM_MAINNET_RPC_PROVIDER_URL: str,
});

export const TurnkeyConfigSchema = z.object({
  TURNKEY_API_URL: str,
  TURNKEY_API_PRIVATE_KEY: str,
  TURNKEY_API_PUBLIC_KEY: str,
  TURNKEY_ORGANIZATION_ID: str,
});

export const BiconomyConfigSchema = z.object({
  BICONOMY_BUNDLER_URL: str,
  BICONOMY_PAYMASTER_API_KEY: str,
});

export const BaseConfigSchema = z.object({
  BASE_JSON_RPC_PROVIDER_URL: str,
});

export const ConfigSchema = AppConfigSchema.and(NodeConfigSchema)
  .and(CookieConfigSchema)
  .and(PostgresConfigSchema)
  .and(RpcProviderConfigSchema)
  .and(JwtConfigSchema)
  .and(TurnkeyConfigSchema)
  .and(BiconomyConfigSchema)
  .and(BaseConfigSchema);

export type TConfig = z.infer<typeof ConfigSchema>;
