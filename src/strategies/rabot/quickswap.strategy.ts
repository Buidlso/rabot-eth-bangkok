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

  public async withdraw(
    signer: TurnkeySigner,
    rabbleWalletAddress: string
  ): Promise<string | undefined> {
    const connectedSigner = signer.connect(this.polygonJsonProvider);
    const smartWallet =
      await this.biconomyHelper.getSmartAccount(connectedSigner);
    const smartWalletAddress = await smartWallet.getAddress();
    const WMATICUSDTLPContract = this.smartContractHelper.getERC20Contract(
      connectedSigner,
      this.smartContractHelper.smartContractAddressMap
        .QUICKSWAP_USDT_WMATIC_LP_TOKEN
    );
    const balanceToWithdraw =
      await WMATICUSDTLPContract.balanceOf(smartWalletAddress);

    const txs = await this.buildWithdrawTxs(
      connectedSigner,
      smartWalletAddress,
      balanceToWithdraw
    );

    return await this.biconomyHelper.performSmartWalletTxs(smartWallet, ...txs);
  }

  private async buildWithdrawTxs(
    connectedSigner: TurnkeySigner,
    smartWalletAddress: string,
    balance: bigint
  ): Promise<any[]> {
    const txs = await Promise.all([
      this.createRemoveApproveTx(connectedSigner),
      this.createRemoveLiquidityTx(
        connectedSigner,
        balance,
        smartWalletAddress
      ),
    ]);
    return txs;
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

  private createRemoveApproveTx(signer: TurnkeySigner): TSmartWalletTx {
    const usdtMaticLpContractAddress =
      this.smartContractHelper.smartContractAddressMap
        .QUICKSWAP_USDT_WMATIC_LP_TOKEN;
    const usdtMaticLpContract = this.smartContractHelper.getERC20Contract(
      signer,
      usdtMaticLpContractAddress
    );
    const quickswapRouterAddress =
      this.smartContractHelper.smartContractAddressMap.POLYGON_QUICKSWAP_ROUTER;
    return {
      to: usdtMaticLpContractAddress,
      data: usdtMaticLpContract.interface.encodeFunctionData('approve', [
        quickswapRouterAddress,
        ethers.MaxUint256,
      ]),
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

  private async createRemoveLiquidityTx(
    signer: TurnkeySigner,
    balanceToWithdraw: bigint,
    smartAccountAddress: string
  ): Promise<any> {
    const Contracts = this.smartContractHelper.smartContractAddressMap;
    const quickswapRouterContract =
      this.smartContractHelper.getQuickswapRouterContract(signer);
    return {
      to: this.smartContractHelper.getQuickswapRouterAddress(),
      data: quickswapRouterContract.interface.encodeFunctionData(
        'removeLiquidity',
        [
          Contracts.POLYGON_WMATIC,
          Contracts.POLYGON_USDT,
          balanceToWithdraw,
          '0',
          '0',
          smartAccountAddress,
          this.DEPOSIT_DEADLINE,
        ]
      ),
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
  getContractAddress(): string {
    return this.smartContractHelper.smartContractAddressMap
      .QUICKSWAP_USDT_WMATIC_LP_TOKEN;
  }
  getWithdrawTxOrder(): string[] {
    return ['APPROVE_WITHDRAW_LP_TOKEN', 'REMOVE_LIQUIDITY'];
  }
  async getStakedBalance(signer: TurnkeySigner): Promise<bigint> {
    const connectedSigner = signer.connect(this.polygonJsonProvider);
    const smartWallet =
      await this.biconomyHelper.getSmartAccount(connectedSigner);
    const smartWalletAddress = await smartWallet.getAddress();
    const WMATICUSDTLPContract = this.smartContractHelper.getERC20Contract(
      connectedSigner,
      this.smartContractHelper.smartContractAddressMap
        .QUICKSWAP_USDT_WMATIC_LP_TOKEN
    );
    const balance = await WMATICUSDTLPContract.balanceOf(smartWalletAddress);
    return balance;
  }
}
