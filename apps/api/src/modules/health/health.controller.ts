import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

// Excluded from the global api/v1 prefix so health probes work at /health, /live, /ready.
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('live')
  live() {
    return { status: 'alive' };
  }

  @Get('ready')
  async ready() {
    await this.connection.db?.admin().ping();
    return { status: 'ready' };
  }
}
