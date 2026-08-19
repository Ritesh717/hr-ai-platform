import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AppError } from '../src/common/errors/app.error';
import { TenantService } from '../src/modules/tenant/tenant.service';

// Mirrors apps/api/cli.py's bootstrap-tenant subcommand — the only way to create the first
// tenant + HR admin (there's no public signup endpoint by design).
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (key && value !== undefined) args[key] = value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ['name', 'slug', 'admin-email', 'admin-password', 'admin-name'];
  for (const key of required) {
    if (!args[key]) {
      console.error(`Missing required --${key}`);
      process.exit(1);
    }
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const tenantService = app.get(TenantService);
    const { tenant, admin } = await tenantService.bootstrap({
      tenantName: args.name,
      tenantSlug: args.slug,
      adminEmail: args['admin-email'],
      adminPassword: args['admin-password'],
      adminFullName: args['admin-name'],
    });
    console.log(`Created tenant '${tenant.slug}' (${tenant._id.toString()})`);
    console.log(`HR admin: ${admin.email} (${admin._id.toString()})`);
  } catch (err) {
    if (err instanceof AppError) {
      console.error(err.message);
      process.exitCode = 1;
    } else {
      throw err;
    }
  } finally {
    await app.close();
  }
}

main();
