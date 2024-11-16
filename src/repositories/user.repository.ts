import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  public async create(user: User): Promise<User> {
    return this.repository.save(user);
  }

  public async existByEmail(email: string): Promise<boolean> {
    return await this.repository.existsBy({ email });
  }

  public async existByWalletAddress(walletAddress: string): Promise<boolean> {
    return await this.repository.existsBy({ walletAddress });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  public async findByWalletAddress(
    walletAddress: string
  ): Promise<User | null> {
    return this.repository.findOneBy({ walletAddress });
  }

  public async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }
}
