import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TurnkeySigner } from '@turnkey/ethers';
import { ethers } from 'ethers';

import type { TConfig } from '@/infra/config';

import { abi as AerodromePoolJSONAbi } from '../domain/assets/abis/AerodromePool.json';
import { abi as AerodromeRouterJSONAbi } from '../domain/assets/abis/AerodromeRouter.json';
import { Erc20Abi } from './abis';
import { abi as UniswapV2RouterJSONAbi } from './abis/UniswapV2Router.json';
import { abi as AerodromPoolTokenJSONAbi } from './abis/VelodromePoolToken.json';
import { abi as QuickswapRouterJSONAbi } from './abis/VelodromeRouter.json';
import { abi as WETH9JSONAbi } from './abis/WETH9.json';

@Injectable()
export class SmartContractHelper {
  private readonly polygonJsonRpcProvider: ethers.JsonRpcProvider;
  private readonly baseJsonRpcProvider: ethers.JsonRpcProvider;

  public readonly smartContractAddressMap = {
    // BASE //
    // Base ERC20 Tokens //
    BASE_WETH: '0x4200000000000000000000000000000000000006',
    BASE_USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    BASE_AERODROME: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    BASE_UNISWAP_V2_ROUTER: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    // Aerodrome //
    AERODROME_ROUTER: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    AERODROME_WETH_USDC_LP_TOKEN: '0xcDAC0d6c6C59727a65F871236188350531885C43',
    AERODROME_WETH_USDC_POOL: '0x519BBD1Dd8C6A94C46080E24f316c14Ee758C025',
    AERODROME_DEFAULT_FACTORY: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    // Polygon //
    POLYGON_WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    POLYGON_USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    POLYGON_UNISWAP_V2_ROUTER: '0xedf6066a2b290C185783862C7F4776A2C8077AD1',
    POLYGON_QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    QUICKSWAP_USDT_WMATIC_LP_TOKEN:
      '0x604229c960e5CACF2aaEAc8Be68Ac07BA9dF81c3',
    INCH_AGGREGATION_ROUTER: '0x111111125421cA6dc452d289314280a0f8842A65',
  };

  constructor(private readonly configService: ConfigService<TConfig>) {
    this.polygonJsonRpcProvider = new ethers.JsonRpcProvider(
      'https://rpc.ankr.com/polygon/01e68499d32f39afb838226c738d21f57518de3d60ca18aa6697bc8822aedb2f'
    );
    this.baseJsonRpcProvider = new ethers.JsonRpcProvider(
      this.configService.getOrThrow('BASE_JSON_RPC_PROVIDER_URL')
    );
  }

  public getBaseWethAddress(): string {
    return this.smartContractAddressMap.BASE_WETH;
  }

  public getBaseUsdcAddress(): string {
    return this.smartContractAddressMap.BASE_USDC;
  }

  public getBaseAerodromeAddress(): string {
    return this.smartContractAddressMap.BASE_AERODROME;
  }

  public getBaseUniswapV2RouterAddress(): string {
    return this.smartContractAddressMap.BASE_UNISWAP_V2_ROUTER;
  }

  public getAerodromeRouterAddress(): string {
    return this.smartContractAddressMap.AERODROME_ROUTER;
  }

  public getAerodromeWethUsdcLpTokenAddress(): string {
    return this.smartContractAddressMap.AERODROME_WETH_USDC_LP_TOKEN;
  }

  public getAerodromeWethUsdcPoolAddress(): string {
    return this.smartContractAddressMap.AERODROME_WETH_USDC_POOL;
  }

  public getPolygonUSDTAddress(): string {
    return this.smartContractAddressMap.POLYGON_USDT;
  }

  public getPolygonUniswapV2RouterAddress(): string {
    return this.smartContractAddressMap.POLYGON_UNISWAP_V2_ROUTER;
  }

  public getQuickswapRouterAddress(): string {
    return this.smartContractAddressMap.POLYGON_QUICKSWAP_ROUTER;
  }

  public getQuickswapRouterContract(signer: TurnkeySigner): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.POLYGON_QUICKSWAP_ROUTER,
      QuickswapRouterJSONAbi,
      signer
    );
  }

  public getUniswapV2RouterContract(signer: TurnkeySigner): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.BASE_UNISWAP_V2_ROUTER,
      UniswapV2RouterJSONAbi,
      signer
    );
  }

  public getPolygonUniswapV2RouterContract(
    signer: TurnkeySigner
  ): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.POLYGON_UNISWAP_V2_ROUTER,
      UniswapV2RouterJSONAbi,
      signer
    );
  }

  public getEcr20UsdcContract(signer: TurnkeySigner): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.POLYGON_USDT,
      Erc20Abi,
      signer
    );
  }

  public getERC20Contract(
    signer: TurnkeySigner,
    tokenAddress: string
  ): ethers.Contract {
    return this.getContract(tokenAddress, Erc20Abi, signer);
  }

  public getAerodromeWethUsdcPoolContract(
    signer: TurnkeySigner
  ): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.AERODROME_WETH_USDC_POOL,
      AerodromePoolJSONAbi,
      signer
    );
  }

  public getAerodromeRouterContract(signer: TurnkeySigner): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.AERODROME_ROUTER,
      AerodromeRouterJSONAbi,
      signer
    );
  }

  public getAerodromeWethUsdcLpTokenContract(
    signer: TurnkeySigner
  ): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.AERODROME_WETH_USDC_LP_TOKEN,
      AerodromPoolTokenJSONAbi,
      signer
    );
  }

  public getBaseWethContract(signer: TurnkeySigner): ethers.Contract {
    return this.getContract(
      this.smartContractAddressMap.BASE_WETH,
      WETH9JSONAbi,
      signer
    );
  }

  public getPolygonJsonRpcProvider(): ethers.JsonRpcProvider {
    return this.polygonJsonRpcProvider;
  }

  public getBaseJsonRpcProvider(): ethers.JsonRpcProvider {
    return this.baseJsonRpcProvider;
  }

  // -------------------------------PRIVATE--------------------------------- //

  private getContract(
    address: string,
    abi: ethers.InterfaceAbi,
    signer: TurnkeySigner
  ): ethers.Contract {
    return new ethers.Contract(address, abi, signer);
  }
}
