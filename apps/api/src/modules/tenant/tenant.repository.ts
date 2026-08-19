import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';

// Mirrors domain/tenant/repository.py's TenantRepository.
@Injectable()
export class TenantRepository {
  constructor(@InjectModel(Tenant.name) private readonly model: Model<TenantDocument>) {}

  getBySlug(slug: string): Promise<TenantDocument | null> {
    return this.model.findOne({ slug }).exec();
  }

  async create(data: { name: string; slug: string }, session?: ClientSession): Promise<TenantDocument> {
    const [tenant] = await this.model.create([data], { session });
    return tenant;
  }
}
