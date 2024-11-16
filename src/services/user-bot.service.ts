import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ethers } from 'ethers';

import { AlchemyWebhookAdapter } from '@/adapters/alchemy-webhook.adapter';
import { TurnKeyAdapter } from '@/adapters/turn-key.adapter';
import type { Bot, User } from '@/domain/entities';
import { Tx } from '@/domain/entities';
import { UserBot } from '@/domain/entities';
import {
  type BotEnum,
  TransactionOwnerEnum,
  TransactionStatusEnum,
} from '@/domain/enums';
import { CryptoHelper } from '@/helpers/crypto.helper';
import { SmartAccountHelper } from '@/helpers/smart-account.helper';
import { SmartContractHelper } from '@/helpers/smart-contract.helper';
import { BotRepository } from '@/repositories/bot.repository';
import { TxRepository } from '@/repositories/tx.repository';
import { UserRepository } from '@/repositories/user.repository';
import { UserBotRepository } from '@/repositories/user-bot.repository';
import { BotOrchestrator } from '@/strategies/rabot';

@Injectable()
export class UserBotService {
  constructor(
    private readonly _userRepository: UserRepository,
    private readonly _botRepository: BotRepository,
    private readonly _userBotRepository: UserBotRepository,
    private readonly _txRepository: TxRepository,
    private readonly _turnKeyAdapter: TurnKeyAdapter,
    private readonly _alchemyWebhookAdapter: AlchemyWebhookAdapter,
    private readonly _cryptoHelper: CryptoHelper,
    private readonly _smartAccountHelper: SmartAccountHelper,
    private readonly _smartContractHelper: SmartContractHelper,
    private readonly _botOrchestrator: BotOrchestrator
  ) {}

  public async create(userId: string, botId: string): Promise<UserBot> {
    const user = await this._findUserById(userId);
    const bot = await this._findBotById(botId);
    const { botWalletId, botWalletAddress } = await this._createUserBotWallet();
    const smartWalletAddress = await this._createSmartWallet(botWalletAddress);
    const userBot = this._createUserBotEntity(
      user.id,
      bot.id,
      bot.type,
      botWalletId,
      botWalletAddress,
      smartWalletAddress,
      user.walletAddress
    );
    await this._alchemyWebhookAdapter.addAddressToWebhook(smartWalletAddress);
    return this._userBotRepository.create(userBot);
  }

  public async listByUserId(userId: string): Promise<UserBot[]> {
    const user = await this._findUserById(userId);
    return this._userBotRepository.listByUserId(user.id);
  }

  public async findById(id: string): Promise<UserBot | null> {
    return this._findUserBotById(id);
  }

  public async deposit(
    id: string,
    batchId: string,
    botType: BotEnum,
    amount: number,
    currency?: string,
    network?: string
  ): Promise<void> {
    const userBot = await this._findUserBotById(id);
    if (!userBot) {
      return;
    }

    const signer = await this._turnKeyAdapter.getSignerByAddress(
      userBot.botWalletAddress
    );
    const txHash = await this._botOrchestrator.deposit(botType, signer, amount);
    if (!txHash) this._throwDepositError();
    const smartContractAddress =
      this._botOrchestrator.getContractAddress(botType);
    const despositTxsOrder = this._botOrchestrator.getDepositTxOrder(botType);
    const txs = this._buildTxsWithOrder(
      userBot.id,
      txHash,
      batchId,
      userBot.botWalletAddress,
      smartContractAddress,
      amount,
      despositTxsOrder,
      currency,
      network
    );
    await this._txRepository.createMany(txs);
    await this._incrementAmountDeposited(userBot, amount);
  }

  public async withdraw(
    botId: string,
    userId: string,
    amountInPercentage: number,
    currency?: string,
    network?: string
  ): Promise<string | void> {
    const userBot = await this._findUserBotByBotIdAndUserId(botId, userId);
    if (!userBot) {
      return;
    }

    console.log({ userBot });

    const signer = await this._turnKeyAdapter.getSignerByAddress(
      userBot.userWalletAddress
    );
    const balance = await this._botOrchestrator.getStakedBalance(
      userBot.botType,
      signer
    );
    const amountInEth = this._calculateWithdrawAmountInEth(
      balance,
      amountInPercentage
    );
    const txHash = await this._botOrchestrator.withdraw(
      userBot.botType,
      userBot.userWalletAddress,
      signer,
      amountInEth
    );
    if (!txHash) this._throwWithdrawError();
    const smartContractAddress = this._botOrchestrator.getContractAddress(
      userBot.botType
    );
    const withdrawTxsOrder = this._botOrchestrator.getWithdrawTxOrder(
      userBot.botType
    );
    const batchId = this._cryptoHelper.genUUID();
    const txs = this._buildTxsWithOrder(
      userBot.id,
      txHash,
      batchId,
      smartContractAddress,
      userBot.botWalletAddress,
      Number(amountInEth),
      withdrawTxsOrder,
      currency,
      network
    );
    await this._txRepository.createMany(txs);
    return txHash;
  }

  private async _createUserBotWallet(): Promise<
    Pick<UserBot, 'botWalletId' | 'botWalletAddress'>
  > {
    const walletName = this._cryptoHelper.genUUID();
    const wallet = await this._turnKeyAdapter.createWallet(walletName);
    return { botWalletId: wallet.id, botWalletAddress: wallet.address };
  }

  private async _createSmartWallet(botWalletAddres: string): Promise<string> {
    const turnkeySigner =
      await this._turnKeyAdapter.getSignerByAddress(botWalletAddres);
    const connectedSigner = turnkeySigner.connect(
      this._smartContractHelper.getPolygonJsonRpcProvider()
    );
    const smartAccount =
      await this._smartAccountHelper.getSmartAccount(connectedSigner);
    return await smartAccount.getAddress();
  }

  private _createUserBotEntity(
    userId: string,
    botId: string,
    type: BotEnum,
    botWalletId: string,
    botWalletAddress: string,
    smartWalletAddress: string,
    userWalletAddress: string
  ): UserBot {
    const userBot = new UserBot();
    userBot.user = { id: userId } as User;
    userBot.bot = { id: botId } as Bot;
    userBot.botType = type;
    userBot.botWalletId = botWalletId;
    userBot.botWalletAddress = botWalletAddress;
    userBot.amountDeposited = '0';
    userBot.balance = 0;
    userBot.smartWalletAddress = smartWalletAddress;
    userBot.userWalletAddress = userWalletAddress;
    return userBot;
  }

  private _buildTxsWithOrder(
    userBotId: string,
    txHash: string,
    batchId: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    txOrder: string[],
    currency?: string,
    network?: string
  ): Tx[] {
    return txOrder.map((txType) => {
      const tx = new Tx();
      tx.userBot = { id: userBotId } as UserBot;
      tx.batchId = batchId;
      tx.txHash = txHash;
      tx.type = txType;
      tx.from = TransactionOwnerEnum.BOT;
      tx.to = TransactionOwnerEnum.CONTRACT;
      tx.fromAddress = fromAddress;
      tx.toAddress = toAddress;
      tx.amount = amount;
      tx.status = TransactionStatusEnum.COMPLETED;
      tx.currency = currency ?? null;
      tx.network = network ?? null;
      tx.gas = 0;
      return tx;
    });
  }

  private async _incrementAmountDeposited(
    userBot: UserBot,
    amount: number
  ): Promise<void> {
    const newAmount = Number(userBot.amountDeposited) + amount;
    await this._userBotRepository.updateAmountDeposited(userBot.id, newAmount);
  }

  private async _findUserById(id: string): Promise<User> {
    const user = await this._userRepository.findById(id);
    if (!user) {
      this._throwUserNotFoundError();
    }
    return user;
  }

  private async _findBotById(id: string): Promise<Bot> {
    const bot = await this._botRepository.findById(id);
    if (!bot) {
      this._throwBotNotFoundError();
    }
    return bot;
  }

  private async _findUserBotById(id: string): Promise<UserBot | null> {
    const userBot = await this._userBotRepository.findById(id);
    if (!userBot) {
      return null;
    }
    return userBot;
  }

  private async _findUserBotByBotIdAndUserId(
    botId: string,
    userId: string
  ): Promise<UserBot | null> {
    const userBot = await this._userBotRepository.findByUserIdAndBotId(
      botId,
      userId
    );
    if (!userBot) {
      return null;
    }
    return userBot;
  }

  private _throwUserNotFoundError(): never {
    throw new NotFoundException('User not found');
  }

  private _throwBotNotFoundError(): never {
    throw new NotFoundException('Bot not found');
  }

  private _throwUserBotNotFoundError(): never {
    throw new NotFoundException('UserBot not found');
  }

  private _throwDepositError(): never {
    throw new InternalServerErrorException('Deposit failed');
  }

  private _throwWithdrawError(): never {
    throw new InternalServerErrorException('Withdraw failed');
  }
  private _calculateWithdrawAmountInEth(
    balance: bigint,
    amountInPercentage: number
  ): string {
    const amountInWei = (balance / 100n) * ethers.toBigInt(amountInPercentage);
    return ethers.formatEther(amountInWei);
  }
}
