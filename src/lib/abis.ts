// ERC20 ABI
export const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Morpho Blue ABI
export const MORPHO_BLUE_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "loanToken", type: "address" },
          { internalType: "address", name: "collateralToken", type: "address" },
          { internalType: "address", name: "oracle", type: "address" },
          { internalType: "address", name: "irm", type: "address" },
          { internalType: "uint256", name: "lltv", type: "uint256" },
        ],
        internalType: "struct MarketParams",
        name: "marketParams",
        type: "tuple",
      },
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
      { internalType: "address", name: "onBehalf", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
    ],
    name: "borrow",
    outputs: [
      { internalType: "uint256", name: "assetsBorrowed", type: "uint256" },
      { internalType: "uint256", name: "sharesBorrowed", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "loanToken", type: "address" },
          { internalType: "address", name: "collateralToken", type: "address" },
          { internalType: "address", name: "oracle", type: "address" },
          { internalType: "address", name: "irm", type: "address" },
          { internalType: "uint256", name: "lltv", type: "uint256" },
        ],
        internalType: "struct MarketParams",
        name: "marketParams",
        type: "tuple",
      },
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
      { internalType: "address", name: "onBehalf", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "repay",
    outputs: [
      { internalType: "uint256", name: "assetsRepaid", type: "uint256" },
      { internalType: "uint256", name: "sharesRepaid", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "loanToken", type: "address" },
          { internalType: "address", name: "collateralToken", type: "address" },
          { internalType: "address", name: "oracle", type: "address" },
          { internalType: "address", name: "irm", type: "address" },
          { internalType: "uint256", name: "lltv", type: "uint256" },
        ],
        internalType: "struct MarketParams",
        name: "marketParams",
        type: "tuple",
      },
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "address", name: "onBehalf", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "supplyCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "loanToken", type: "address" },
          { internalType: "address", name: "collateralToken", type: "address" },
          { internalType: "address", name: "oracle", type: "address" },
          { internalType: "address", name: "irm", type: "address" },
          { internalType: "uint256", name: "lltv", type: "uint256" },
        ],
        internalType: "struct MarketParams",
        name: "marketParams",
        type: "tuple",
      },
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "address", name: "onBehalf", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
    ],
    name: "withdrawCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "id", type: "bytes32" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "position",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "supplyShares", type: "uint256" },
          { internalType: "uint128", name: "borrowShares", type: "uint128" },
          { internalType: "uint128", name: "collateral", type: "uint128" },
        ],
        internalType: "struct Position",
        name: "p",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "id", type: "bytes32" }],
    name: "market",
    outputs: [
      {
        components: [
          { internalType: "uint128", name: "totalSupplyAssets", type: "uint128" },
          { internalType: "uint128", name: "totalSupplyShares", type: "uint128" },
          { internalType: "uint128", name: "totalBorrowAssets", type: "uint128" },
          { internalType: "uint128", name: "totalBorrowShares", type: "uint128" },
          { internalType: "uint128", name: "lastUpdate", type: "uint128" },
          { internalType: "uint128", name: "fee", type: "uint128" },
        ],
        internalType: "struct Market",
        name: "m",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
