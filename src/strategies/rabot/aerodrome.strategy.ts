import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TurnkeySigner } from '@turnkey/ethers';
import { ethers } from 'ethers';
import { Web3 } from 'web3';

import type { LiquidityOutAmount, TSmartWalletTx } from '@/domain';
import { abi as AerodromeRouterJSONAbi } from '@/domain/assets/abis/AerodromeRouter.json';
import { abi as UniswapV2RouterJSONAbi } from '@/domain/assets/abis/UniswapV2Router.json';
import { BotEnum } from '@/domain/enums';
import { SmartAccountHelper } from '@/helpers/smart-account.helper';
import { SmartContractHelper } from '@/helpers/smart-contract.helper';
import type { TConfig } from '@/infra/config';

import type { IBotStrategy } from './bot.strategy.interface';

@Injectable()
export class AerodromeRabotStrategy implements IBotStrategy {
  private readonly logger = new Logger(AerodromeRabotStrategy.name);
  private readonly web3: Web3;
  private readonly baseJsonRpcProvider: ethers.JsonRpcProvider;
  private readonly MINUTES_UNTIL_DEPOSIT_DEADLINE = 20;
  private readonly MINUTES_UNTIL_REMOVE_LIQUIDITY_DEADLINE = 10;
  private readonly DEPOSIT_DEADLINE: number;
  private readonly WITHDRAW_DEADLINE: number;
  private readonly WETH_USDC_PATH: string[];
  private readonly USDC_WETH_PATH: string[];

  constructor(
    private readonly _smartContractHelper: SmartContractHelper,
    private readonly _biconomyHelper: SmartAccountHelper,
    private readonly _configService: ConfigService<TConfig>
  ) {
    this.baseJsonRpcProvider =
      this._smartContractHelper.getBaseJsonRpcProvider();
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        this._configService.getOrThrow<string>('BASE_JSON_RPC_PROVIDER_URL')
      )
    );
    this.DEPOSIT_DEADLINE = this.getDepositDeadline();
    this.WITHDRAW_DEADLINE = this.getWithdrawDeadline();
    this.WETH_USDC_PATH = this.getWETHUSDCPath();
    this.USDC_WETH_PATH = this.getUSDCWETHPath();
  }

  public getRabot(): BotEnum {
    return BotEnum.AERODROME_WETH_USDC;
  }

  public getContractAddress(): string {
    return this._smartContractHelper.getAerodromeWethUsdcPoolAddress();
  }

  public getDepositTxOrder(): string[] {
    return ['SWAP', 'APPROVE', 'LIQUIDITY_ADD', 'APPROVE_LP_TOKEN', 'DEPOSIT'];
  }

  public getWithdrawTxOrder(): string[] {
    return [
      'WITHDRAW',
      'APPROVE_WITHDRAW_LP_TOKEN',
      'REMOVE_LIQUIDITY',
      'CLAIM_REWARD',
      'TRANSFER_AERODROME',
      'CLAIM_TRADING_FEE',
      'USDC_APPROVE',
      'SWAP_USDC_TO_ETH',
      'SWAP_WETH_TO_ETH',
      'TRANSFER_ETH',
    ];
  }

  public async deposit(
    signer: TurnkeySigner,
    amount: number
  ): Promise<string | undefined> {
    try {
      const connectedSigner = signer.connect(this.baseJsonRpcProvider);
      const smartWallet =
        await this._biconomyHelper.getSmartAccount(connectedSigner);
      const smartWalletAddress = await smartWallet.getAddress();
      const txs = await this.buildDepositTxs(
        connectedSigner,
        amount,
        smartWalletAddress
      );

      return await this._biconomyHelper.performSmartWalletTxs(
        smartWallet,
        ...txs
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  public async withdraw(
    signer: TurnkeySigner,
    rabbleWalletAddress: string,
    amount: string
  ): Promise<string | undefined> {
    try {
      const amountInWei = ethers.parseEther(amount);
      const connectedSigner = signer.connect(this.baseJsonRpcProvider);
      const smartWallet =
        await this._biconomyHelper.getSmartAccount(connectedSigner);
      const smartWalletAddress = await smartWallet.getAddress();

      const liquidityOutAmount = await this.getRemoveLiquidityOutAmount(
        smartWalletAddress,
        amountInWei
      );

      const txs = await this.buildWithdrawTxs(
        connectedSigner,
        amountInWei,
        rabbleWalletAddress,
        smartWalletAddress,
        liquidityOutAmount.wethAmountOutInWei,
        liquidityOutAmount.usdcAmountOutInWei
      );

      return await this._biconomyHelper.performSmartWalletTxs(
        smartWallet,
        ...txs
      );
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async getStakedBalance(turnkeySigner: TurnkeySigner): Promise<bigint> {
    const connectedSigner = turnkeySigner.connect(this.baseJsonRpcProvider);
    const smartWallet =
      await this._biconomyHelper.getSmartAccount(connectedSigner);
    const smartWalletAddress = await smartWallet.getAddress();
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcPoolContract(
        connectedSigner
      );
    const balance =
      await aerodromWethUsdcPoolContract.balanceOf(smartWalletAddress);
    return balance;
  }

  // -------------------------------PRIVATE--------------------------------- //

  private async buildDepositTxs(
    connectedSigner: TurnkeySigner,
    amount: number,
    smartWalletAddress: string
  ): Promise<TSmartWalletTx[]> {
    const smartAccountBalance =
      await this.baseJsonRpcProvider.getBalance(smartWalletAddress);
    const amountInWei = ethers.parseEther(amount.toString());
    if (amountInWei > smartAccountBalance)
      throw new Error('Insufficient wallet balance.');
    const swapAmount = amount / 2;
    const swapAmountInWei = ethers.parseEther(swapAmount.toString());
    const minAmountOut = await this.getMinTokenAmount(
      swapAmountInWei,
      smartWalletAddress
    );
    const wethDesiredAmountInWei = swapAmountInWei;
    const usdcDesiredAmountInWei = minAmountOut;
    const txs = await Promise.all([
      this.createSwapTx(
        connectedSigner,
        smartWalletAddress,
        swapAmountInWei,
        minAmountOut
      ),
      this.createApproveTx(connectedSigner),
      this.createAddLiquidityTx(
        connectedSigner,
        swapAmountInWei,
        minAmountOut,
        smartWalletAddress
      ),
      this.createApproveLPTokenTx(connectedSigner),
      this.createDepositTx(
        connectedSigner,
        smartWalletAddress,
        wethDesiredAmountInWei,
        usdcDesiredAmountInWei
      ),
    ]);
    return txs;
  }

  private async buildWithdrawTxs(
    connectedSigner: TurnkeySigner,
    amountInWei: bigint,
    rabbleWalletAddress: string,
    smartWalletAddress: string,
    wethAmountOutInWei: bigint,
    usdcAmountOutInWei: bigint
  ): Promise<TSmartWalletTx[]> {
    const wethDesiredAmountInWei = 0;
    const usdcDesiredAmountInWei = 0;

    const txs = await Promise.all([
      this.createWithdrawTx(connectedSigner, amountInWei),
      this.createApproveWithdrawlLPTokenTx(connectedSigner),
      this.createRemoveLiquidityTx(
        connectedSigner,
        smartWalletAddress,
        amountInWei,
        wethDesiredAmountInWei,
        usdcDesiredAmountInWei
      ),
      this.createClaimRewardTx(connectedSigner, smartWalletAddress),
      this.createTransferAerodromeTx(
        connectedSigner,
        smartWalletAddress,
        rabbleWalletAddress
      ),
      this.createClaimTradingFeeTx(connectedSigner),
      this.createUsdcApproveTx(
        connectedSigner,
        smartWalletAddress,
        usdcAmountOutInWei
      ),
      this.createSwapUsdcToEthTx(
        connectedSigner,
        smartWalletAddress,
        rabbleWalletAddress,
        usdcAmountOutInWei
      ),
      this.createSwapWethToEthTx(
        connectedSigner,
        smartWalletAddress,
        wethAmountOutInWei
      ),
      this.createTransferEthTx(rabbleWalletAddress, wethAmountOutInWei),
    ]);
    return txs;
  }

  private getDepositDeadline(): number {
    const now = new Date();
    now.setMinutes(now.getMinutes() + this.MINUTES_UNTIL_DEPOSIT_DEADLINE);
    return now.getTime();
  }

  private getWithdrawDeadline(): number {
    const now = new Date();
    now.setMinutes(
      now.getMinutes() + this.MINUTES_UNTIL_REMOVE_LIQUIDITY_DEADLINE
    );
    return now.getTime();
  }

  private getWETHUSDCPath(): string[] {
    return [
      this._smartContractHelper.getBaseWethAddress(),
      this._smartContractHelper.getBaseUsdcAddress(),
    ];
  }

  private getUSDCWETHPath(): string[] {
    return [
      this._smartContractHelper.getBaseUsdcAddress(),
      this._smartContractHelper.getBaseWethAddress(),
    ];
  }

  private async createSwapTx(
    signer: TurnkeySigner,
    smartWalletAddress: string,
    amount: bigint,
    minAmountOut: bigint
  ): Promise<TSmartWalletTx> {
    const uniswapV2RouterContract =
      this._smartContractHelper.getUniswapV2RouterContract(signer);

    return {
      to: this._smartContractHelper.getBaseUniswapV2RouterAddress(),
      data: uniswapV2RouterContract.interface.encodeFunctionData(
        'swapExactETHForTokens',
        [
          minAmountOut,
          this.WETH_USDC_PATH,
          smartWalletAddress,
          this.DEPOSIT_DEADLINE,
        ]
      ),
      value: amount,
    };
  }

  private createApproveTx(signer: TurnkeySigner): TSmartWalletTx {
    const usdcContract = this._smartContractHelper.getEcr20UsdcContract(signer);
    const usdcContractAddress = this._smartContractHelper.getBaseUsdcAddress();
    const aerodromeRouterAddress =
      this._smartContractHelper.getAerodromeRouterAddress();
    return {
      to: usdcContractAddress,
      data: usdcContract.interface.encodeFunctionData('approve', [
        aerodromeRouterAddress,
        ethers.MaxUint256,
      ]),
    };
  }

  private createApproveLPTokenTx(signer: TurnkeySigner): TSmartWalletTx {
    const lpTokenAddress =
      this._smartContractHelper.getAerodromeWethUsdcLpTokenAddress();
    const lpTokenContract = this._smartContractHelper.getERC20Contract(
      signer,
      lpTokenAddress
    );
    const poolAddress =
      this._smartContractHelper.getAerodromeWethUsdcPoolAddress();
    return {
      to: lpTokenAddress,
      data: lpTokenContract.interface.encodeFunctionData('approve', [
        poolAddress,
        ethers.MaxUint256,
      ]),
    };
  }

  private async createAddLiquidityTx(
    signer: TurnkeySigner,
    amount: bigint,
    amountTokenDesired: bigint,
    smartWalletAddress: string
  ): Promise<TSmartWalletTx> {
    const aerodromeRouterContract =
      this._smartContractHelper.getAerodromeRouterContract(signer);
    const isStable = false;
    const minWETHToDeposit = '0';
    const minUSDCToDeposit = '0';
    return {
      to: this._smartContractHelper.getAerodromeRouterAddress(),
      data: aerodromeRouterContract.interface.encodeFunctionData(
        'addLiquidityETH',
        [
          this._smartContractHelper.getBaseUsdcAddress(),
          isStable,
          amountTokenDesired,
          minUSDCToDeposit,
          minWETHToDeposit,
          smartWalletAddress,
          this.DEPOSIT_DEADLINE,
        ]
      ),
      value: amount,
    };
  }

  private async createDepositTx(
    signer: TurnkeySigner,
    smartAccountAddress: string,
    amountWETHDesiredInWei: bigint,
    amountUSDCDesiredInWei: bigint
  ): Promise<TSmartWalletTx> {
    const poolContract =
      this._smartContractHelper.getAerodromeWethUsdcPoolContract(signer);

    const liquidityAmountOut = await this.getLiquidityTokenOutAmount(
      amountWETHDesiredInWei,
      amountUSDCDesiredInWei,
      smartAccountAddress
    );

    return {
      to: this._smartContractHelper.getAerodromeWethUsdcPoolAddress(),
      data: poolContract.interface.encodeFunctionData('deposit', [
        liquidityAmountOut,
      ]),
    };
  }

  private async getMinTokenAmount(
    swapAmountInWei: bigint,
    smartWalletAddress: string
  ): Promise<bigint> {
    try {
      const baseUniswapV2Router =
        this._smartContractHelper.getBaseUniswapV2RouterAddress();
      const uniswapContract = new this.web3.eth.Contract(
        UniswapV2RouterJSONAbi,
        baseUniswapV2Router
      );
      const placholderAmountOut = '0';
      const minAmountOutRes = await uniswapContract.methods
        .swapExactETHForTokens(
          placholderAmountOut,
          this.WETH_USDC_PATH,
          smartWalletAddress,
          this.DEPOSIT_DEADLINE
        )
        .call({
          value: swapAmountInWei.toString(),
          from: smartWalletAddress,
        });

      return minAmountOutRes[1];
    } catch (error) {
      this.logger.error('ERROR in getting min out', error);
      throw new Error('Error in getting min out');
    }
  }

  private async getLiquidityTokenOutAmount(
    amountWETHDesiredInWei: bigint,
    amountUSDCDesiredInWei: bigint,
    smartAccountAddress: string
  ): Promise<bigint | undefined> {
    try {
      const aerodromeContract = new this.web3.eth.Contract(
        AerodromeRouterJSONAbi,
        this._smartContractHelper.getAerodromeRouterAddress()
      );
      const isStable = false;
      const result: any = await aerodromeContract.methods
        .quoteAddLiquidity(
          this._smartContractHelper.getBaseWethAddress(),
          this._smartContractHelper.getBaseUsdcAddress(),
          isStable,
          this._smartContractHelper.getAerodromDefaultFactoryContractAddress(),
          amountWETHDesiredInWei,
          amountUSDCDesiredInWei
        )
        .call({
          from: smartAccountAddress,
        });
      return result.liquidity;
    } catch (error) {
      console.error('Error getLiquidityTokenOutAmount:', error);
    }
  }

  private async getRemoveLiquidityOutAmount(
    smartAccountAddress: string,
    amount: bigint
  ): Promise<LiquidityOutAmount> {
    const aerodromeContract = new this.web3.eth.Contract(
      AerodromeRouterJSONAbi,
      this._smartContractHelper.getAerodromeRouterAddress()
    );
    const isStable = false;
    const result: any = await aerodromeContract.methods
      .quoteRemoveLiquidity(
        this._smartContractHelper.getBaseWethAddress(),
        this._smartContractHelper.getBaseUsdcAddress(),
        isStable,
        this._smartContractHelper.getAerodromDefaultFactoryContractAddress(),
        amount
      )
      .call({
        from: smartAccountAddress,
      });

    return {
      wethAmountOutInWei: result.amountA,
      usdcAmountOutInWei: result.amountB,
    };
  }

  private async createWithdrawTx(
    signer: TurnkeySigner,
    amount: bigint
  ): Promise<TSmartWalletTx> {
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcPoolContract(signer);

    return {
      to: this._smartContractHelper.getAerodromeWethUsdcPoolAddress(),
      data: aerodromWethUsdcPoolContract.interface.encodeFunctionData(
        'withdraw',
        [amount]
      ),
    };
  }

  private createApproveWithdrawlLPTokenTx(
    signer: TurnkeySigner
  ): TSmartWalletTx {
    const aerodromWethUsdcLpContractAddress =
      this._smartContractHelper.getAerodromeWethUsdcLpTokenAddress();
    const aerodromWethUsdcLpContract =
      this._smartContractHelper.getERC20Contract(
        signer,
        aerodromWethUsdcLpContractAddress
      );
    const aerodromeRouterContractAddress =
      this._smartContractHelper.getAerodromeRouterAddress();

    return {
      to: aerodromWethUsdcLpContractAddress,
      data: aerodromWethUsdcLpContract.interface.encodeFunctionData('approve', [
        aerodromeRouterContractAddress,
        ethers.MaxUint256,
      ]),
    };
  }

  private async createRemoveLiquidityTx(
    signer: TurnkeySigner,
    smartWalletAddress: string,
    amount: bigint,
    wethDesiredAmountInWei: number,
    usdcDesiredAmountInWei: number
  ): Promise<TSmartWalletTx> {
    const isStable: boolean = false;
    const aerodromeRouterContract =
      this._smartContractHelper.getAerodromeRouterContract(signer);
    const removeLiquidityEncodedData =
      aerodromeRouterContract.interface.encodeFunctionData('removeLiquidity', [
        this._smartContractHelper.getBaseWethAddress(),
        this._smartContractHelper.getBaseUsdcAddress(),
        isStable,
        amount,
        wethDesiredAmountInWei.toString(),
        usdcDesiredAmountInWei.toString(),
        smartWalletAddress,
        this.WITHDRAW_DEADLINE,
      ]);

    return {
      to: this._smartContractHelper.getAerodromeRouterAddress(),
      data: removeLiquidityEncodedData,
      value: 0n,
    };
  }

  private createClaimRewardTx(
    signer: TurnkeySigner,
    smartAccountAddress: string
  ): TSmartWalletTx {
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcPoolContract(signer);

    return {
      to: this._smartContractHelper.getAerodromeWethUsdcPoolAddress(),
      data: aerodromWethUsdcPoolContract.interface.encodeFunctionData(
        'getReward',
        [smartAccountAddress]
      ),
    };
  }

  private async createTransferAerodromeTx(
    signer: TurnkeySigner,
    smartWalletAddress: string,
    rabbleWalletAddress: string
  ): Promise<TSmartWalletTx> {
    const aerodromeWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcPoolContract(signer);
    const aerodromeReward =
      await aerodromeWethUsdcPoolContract.rewards(smartWalletAddress);
    const baseAerodromeAddress =
      this._smartContractHelper.getBaseAerodromeAddress();
    const baseAerodromeContract = this._smartContractHelper.getERC20Contract(
      signer,
      baseAerodromeAddress
    );
    const transferAerodromeEncodedData =
      baseAerodromeContract.interface.encodeFunctionData('transfer', [
        rabbleWalletAddress,
        aerodromeReward,
      ]);

    return {
      to: baseAerodromeAddress,
      data: transferAerodromeEncodedData,
    };
  }

  private async createClaimTradingFeeTx(
    signer: TurnkeySigner
  ): Promise<TSmartWalletTx> {
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcLpTokenContract(signer);

    return {
      to: this._smartContractHelper.getAerodromeWethUsdcLpTokenAddress(),
      data: aerodromWethUsdcPoolContract.interface.encodeFunctionData(
        'claimFees'
      ),
    };
  }

  private async createUsdcApproveTx(
    signer: TurnkeySigner,
    smartAccountAddress: string,
    usdcAmountOutInWei: bigint
  ): Promise<TSmartWalletTx> {
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcLpTokenContract(signer);

    const claimableUsdc =
      await aerodromWethUsdcPoolContract.claimable1(smartAccountAddress);
    const totalUsdcAmount = usdcAmountOutInWei + claimableUsdc;

    const baseUsdcAddress = this._smartContractHelper.getBaseUsdcAddress();
    const baseUsdcContract = this._smartContractHelper.getERC20Contract(
      signer,
      baseUsdcAddress
    );

    return {
      to: baseUsdcAddress,
      data: baseUsdcContract.interface.encodeFunctionData('approve', [
        this._smartContractHelper.getBaseUniswapV2RouterAddress(),
        totalUsdcAmount,
      ]),
    };
  }

  private async createSwapWethToEthTx(
    signer: TurnkeySigner,
    smartAccountAddress: string,
    wethAmountOutInWei: bigint
  ): Promise<TSmartWalletTx> {
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcLpTokenContract(signer);

    const claimableWeth =
      await aerodromWethUsdcPoolContract.claimable0(smartAccountAddress);
    const baseWethAddress = this._smartContractHelper.getBaseWethAddress();
    const baseWethContract =
      this._smartContractHelper.getBaseWethContract(signer);
    const totalWethAmount = wethAmountOutInWei + claimableWeth;

    return {
      to: baseWethAddress,
      data: baseWethContract.interface.encodeFunctionData('withdraw', [
        totalWethAmount,
      ]),
    };
  }

  private async createSwapUsdcToEthTx(
    signer: TurnkeySigner,
    smartAccountAddress: string,
    rabbleWalletAddress: string,
    usdcAmountOutInWei: bigint
  ): Promise<TSmartWalletTx> {
    const aerodromWethUsdcPoolContract =
      this._smartContractHelper.getAerodromeWethUsdcLpTokenContract(signer);

    const claimableUsdc =
      await aerodromWethUsdcPoolContract.claimable1(smartAccountAddress);
    // const usdcContract = this.smartContractHelper.getEcr20UsdcContract(signer);
    // const usdcBalance = await usdcContract.balanceOf(smartAccountAddress);
    const totalUsdcAmount = usdcAmountOutInWei + claimableUsdc;
    const EthAmountOutMin = '0';
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    const uniswapV2Contract =
      this._smartContractHelper.getUniswapV2RouterContract(signer);
    return {
      to: this._smartContractHelper.getBaseUniswapV2RouterAddress(),
      data: uniswapV2Contract.interface.encodeFunctionData(
        'swapExactTokensForETHSupportingFeeOnTransferTokens',
        [
          totalUsdcAmount,
          EthAmountOutMin,
          this.USDC_WETH_PATH,
          rabbleWalletAddress,
          deadline,
        ]
      ),
    };
  }

  private async createTransferEthTx(
    rabbleWalletAddress: string,
    wethAmountOutInWei: bigint
  ): Promise<TSmartWalletTx> {
    const totalTransferEthAmount = wethAmountOutInWei;

    return {
      to: rabbleWalletAddress,
      data: '0x',
      value: totalTransferEthAmount,
    };
  }
}
