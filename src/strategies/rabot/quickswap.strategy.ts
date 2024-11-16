import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TurnkeySigner } from '@turnkey/ethers';
import { ethers } from 'ethers';
import { Web3 } from 'web3';

import { BotEnum } from '@/domain/enums';
import { abi as UniswapV2RouterJSONAbi } from '@/helpers/abis/UniswapV2Router.json';
import { SmartAccountHelper } from '@/helpers/smart-account.helper';
import { SmartContractHelper } from '@/helpers/smart-contract.helper';
import type { TConfig } from '@/infra/config';

import type { IBotStrategy } from './bot.strategy.interface';

export type TSmartWalletTx = {
  to: string;
  data: string;
  value?: bigint;
};

@Injectable()
export class QuickswapPoolStrategy implements IBotStrategy {
  private readonly web3: Web3;
  private readonly polygonJsonProvider: ethers.JsonRpcProvider;
  private readonly DEPOSIT_DEADLINE: number;
  private readonly WMATIC_USDT_PATH: string[];

  constructor(
    private readonly smartContractHelper: SmartContractHelper,
    private readonly biconomyHelper: SmartAccountHelper,
    private readonly _configService: ConfigService<TConfig>
  ) {
    this.web3 = new Web3(
      new Web3(
        this._configService.getOrThrow<string>(
          'POLYGON_MAINNET_RPC_PROVIDER_URL'
        )
      )
    );
    this.DEPOSIT_DEADLINE = this.getDepositDeadline();
    this.WMATIC_USDT_PATH = [
      this.smartContractHelper.smartContractAddressMap.POLYGON_WMATIC,
      this.smartContractHelper.smartContractAddressMap.POLYGON_USDT,
    ];
    this.polygonJsonProvider =
      this.smartContractHelper.getPolygonJsonRpcProvider();
  }

  public getDepositTxOrder(): string[] {
    return ['SWAP', 'APPROVE', 'LIQUIDITY_ADD'];
  }

  private getDepositDeadline(): number {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 20);
    return now.getTime();
  }

  public async deposit(
    signer: TurnkeySigner,
    amount: number
  ): Promise<any | undefined> {
    try {
      const connectedSigner = signer.connect(this.polygonJsonProvider);
      const smartWallet =
        await this.biconomyHelper.getSmartAccount(connectedSigner);
      const smartWalletAddress = await smartWallet.getAddress();
      console.log(smartWalletAddress);

      const txs = await this.buildDepositTxs(
        connectedSigner,
        amount,
        smartWalletAddress
      );

      return await this.biconomyHelper.performSmartWalletTxs(
        smartWallet,
        ...txs
      );
    } catch (error) {
      console.log({ error });
    }
  }

  private async buildDepositTxs(
    connectedSigner: TurnkeySigner,
    amount: number,
    tunrkeyWalletAddress: string
  ): Promise<any[]> {
    const smartAccountBalance =
      await this.polygonJsonProvider.getBalance(tunrkeyWalletAddress);
    const amountInWei = ethers.parseEther(amount.toString());
    if (amountInWei > smartAccountBalance)
      throw new Error('Insufficient wallet balance.');
    const swapAmount = amount / 2;
    const swapAmountInWei = ethers.parseEther(swapAmount.toString());
    const minAmountOut = await this.getMinTokenAmount(swapAmountInWei);
    const txs = await Promise.all([
      this.createSwapTx(
        connectedSigner,
        tunrkeyWalletAddress,
        swapAmountInWei,
        minAmountOut[1]
      ),
      this.createApproveTx(connectedSigner),
      this.createAddLiquidityTx(
        connectedSigner,
        swapAmountInWei,
        minAmountOut[1],
        tunrkeyWalletAddress
      ),
    ]);
    return txs;
  }

  private async createSwapTx(
    signer: TurnkeySigner,
    tunrkeyWalletAddress: string,
    amount: bigint,
    minAmountOut: bigint
  ): Promise<any> {
    const uniswapV2RouterContract =
      this.smartContractHelper.getPolygonUniswapV2RouterContract(signer);

    return {
      to: this.smartContractHelper.getPolygonUniswapV2RouterAddress(),
      data: uniswapV2RouterContract.interface.encodeFunctionData(
        'swapExactETHForTokens',
        [
          minAmountOut,
          this.WMATIC_USDT_PATH,
          tunrkeyWalletAddress,
          this.DEPOSIT_DEADLINE,
        ]
      ),
      value: amount,
    };
  }

  private createApproveTx(signer: TurnkeySigner): TSmartWalletTx {
    const usdcContract = this.smartContractHelper.getEcr20UsdcContract(signer);
    const usdcContractAddress =
      this.smartContractHelper.getPolygonUSDTAddress();
    const quickswapRouterAddress =
      this.smartContractHelper.getQuickswapRouterAddress();
    return {
      to: usdcContractAddress,
      data: usdcContract.interface.encodeFunctionData('approve', [
        quickswapRouterAddress,
        ethers.MaxUint256,
      ]),
    };
  }

  private async createAddLiquidityTx(
    signer: TurnkeySigner,
    amount: bigint,
    amountTokenDesired: bigint,
    tunrkeyWalletAddress: string
  ): Promise<any> {
    const quickswapRouterContract =
      this.smartContractHelper.getQuickswapRouterContract(signer);
    const minGHSTToDeposit = '0';
    const minUSDCToDeposit = '0';
    return {
      to: this.smartContractHelper.getQuickswapRouterAddress(),
      data: quickswapRouterContract.interface.encodeFunctionData(
        'addLiquidityETH',
        [
          this.smartContractHelper.getPolygonUSDTAddress(),
          amountTokenDesired,
          minUSDCToDeposit,
          minGHSTToDeposit,
          tunrkeyWalletAddress,
          this.DEPOSIT_DEADLINE,
        ]
      ),
      value: amount,
    };
  }

  private async getMinTokenAmount(amountIn: bigint) {
    try {
      const uniswapV2Router =
        this.smartContractHelper.smartContractAddressMap
          .POLYGON_UNISWAP_V2_ROUTER;
      const uniswapV2RouterContract = new this.web3.eth.Contract(
        UniswapV2RouterJSONAbi,
        uniswapV2Router
      );
      // const amountIn = Web3.utils.toWei("0.00001", "ether");
      const result = await uniswapV2RouterContract.methods
        .getAmountsOut(amountIn, this.WMATIC_USDT_PATH)
        .call();
      return result;
    } catch (error) {
      console.error('Error getMinETHAmount:', error);
    }
  }

  getRabot(): BotEnum {
    return BotEnum.QUICKSWAP_LP;
  }
  withdraw(
    signer: TurnkeySigner,
    rabbleWalletAddress: string,
    amount: string
  ): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  getContractAddress(): string {
    return this.smartContractHelper.smartContractAddressMap
      .QUICKSWAP_USDT_WMATIC_LP_TOKEN;
  }
  getWithdrawTxOrder(): string[] {
    throw new Error('Method not implemented.');
  }
  getStakedBalance(signer: TurnkeySigner): Promise<bigint> {
    throw new Error('Method not implemented.');
  }
}
