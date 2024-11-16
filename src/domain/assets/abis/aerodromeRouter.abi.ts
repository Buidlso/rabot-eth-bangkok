export const AerodromRouterAbi = [
  'function addLiquidityETH(address token,bool stable,uint256 amountTokenDesired,uint256 amountTokenMin,uint256 amountETHMin,address to,uint256 deadline) external payable ensure(deadline) returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',
  'function deposit(uint256 _amount) external',
  'function withdraw(uint256 _amount) external',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function balanceOf(address account) external view returns (uint256)',
] as const;
