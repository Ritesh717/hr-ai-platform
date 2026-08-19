import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { AuditLog } from '../src/modules/audit-log/schemas/audit-log.schema';
import { Department } from '../src/modules/department/schemas/department.schema';
import { Employee } from '../src/modules/employee/schemas/employee.schema';
import { Role } from '../src/modules/rbac/schemas/role.schema';
import { Tenant } from '../src/modules/tenant/schemas/tenant.schema';

// Mongo has no Alembic — this is the closest equivalent to "run migrations" at deploy time:
// explicitly (re)builds every schema-declared index (uniqueness constraints included) rather
// than relying on Mongoose's implicit background sync on first model use.
const MODELS = [Tenant, Employee, Role, Department, AuditLog];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
  try {
    for (const modelClass of MODELS) {
      const model = app.get(getModelToken(modelClass.name));
      await model.syncIndexes();
      console.log(`Synced indexes for ${modelClass.name}`);
    }
  } finally {
    await app.close();
  }
}

main();
