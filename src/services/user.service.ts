import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { User } from '@/domain/entities';
import { UserRepository } from '@/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly _userRepository: UserRepository) {}

  public async create(
    email: string,
    walletAddress: string,
    name?: string
  ): Promise<User> {
    const exisitngUser = await this._userRepository.findByEmail(email);
    if (exisitngUser) return exisitngUser;
    const user = this._createUserEntity(email, walletAddress, name);
    return await this._userRepository.create(user);
  }

  public async findByWalletAddress(walletAddress: string): Promise<User> {
    const user = await this._userRepository.findByWalletAddress(walletAddress);
    if (!user) {
      this._throwUserNotFoundError();
    }
    return user;
  }

  public async findByEmail(email: string): Promise<User> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      this._throwUserNotFoundError();
    }
    return user;
  }

  public async findById(id: string): Promise<User> {
    const user = await this._userRepository.findById(id);
    if (!user) {
      this._throwUserNotFoundError();
    }
    return user;
  }

  private async _rejectExisitingUser(email: string): Promise<void> {
    if (await this._userRepository.existByEmail(email)) {
      this._throwUserAlreadyExistsError();
    }
  }

  private async isAnExisitngUser(email: string): Promise<boolean> {
    return this._userRepository.existByEmail(email);
  }

  private _createUserEntity(
    email: string,
    walletAddress: string,
    name?: string
  ) {
    const user = new User();
    user.email = email;
    user.walletAddress = walletAddress;
    user.name = name ?? null;
    return user;
  }

  private _throwUserAlreadyExistsError(): never {
    throw new ConflictException('User already exists');
  }

  private _throwUserNotFoundError(): never {
    throw new NotFoundException('User not found');
  }
}
