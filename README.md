# GoldFi - DeFi Borrowing App

A Web2-native DeFi borrowing application that allows users to deposit USDT, swap to XAUT0 (gold-backed tokens), and borrow USDT against their gold collateral using Morpho on Arbitrum.

## Features

- **Email Login**: Sign up with just your email via Privy
- **Smart Wallet**: Biconomy Nexus smart wallet with gasless transactions
- **Deposit USDT**: Send USDT to your smart wallet address
- **Swap**: Convert USDT to XAUT0 via CoW Swap
- **Borrow**: Use XAUT0 as collateral to borrow USDT from Morpho
- **Position Management**: Repay loans, add/remove collateral
- **Gasless**: All transactions are sponsored - no ETH required

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Auth**: Privy (email login only)
- **Smart Wallet**: Biconomy Nexus
- **Chain**: Arbitrum
- **Swap**: CoW Swap API
- **Lending**: Morpho Blue
- **State**: Wagmi, Viem, TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Privy account ([get one here](https://privy.io))
- Biconomy account ([get one here](https://biconomy.io))

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd defi-borrowing-app
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY=your_biconomy_paymaster_key
NEXT_PUBLIC_BICONOMY_BUNDLER_KEY=your_biconomy_bundler_key
NEXT_PUBLIC_ARB_RPC_URL=https://arb1.arbitrum.io/rpc
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Flow

1. **Sign Up**: Enter your email to create an account
2. **Deposit**: Send USDT on Arbitrum to your smart wallet
3. **Swap**: Convert USDT to XAUT0 (gold-backed tokens)
4. **Borrow**: Use XAUT0 as collateral to borrow USDT
5. **Manage**: Repay loans, add more collateral, or withdraw

## Smart Contract Addresses (Arbitrum)

- **USDT**: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`
- **XAUT0**: `0x40461291347e1eCbb09499F3371D3f17f10d7159`
- **Morpho Blue**: `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`
- **Market ID**: `0x1d094624063756fc61aaf061c7da056aebe3b3ad0ae0395b22e00db6c074de7c`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Login   │  │  Deposit │  │   Swap   │  │   Borrow   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Privy Auth │  Biconomy Smart Wallet  │  Wagmi/Viem       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                             ▼                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Arbitrum │  │ CoW Swap │  │  Morpho  │  │   USDT     │  │
│  │  Chain   │  │   API    │  │  Lending │  │   XAUT0    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Gasless Transactions

All transactions are gasless thanks to Biconomy's paymaster:
- User operations are bundled and sponsored
- No ETH required in the user's wallet
- Seamless Web2-like experience

## Security

- Smart contracts audited by Morpho and Biconomy
- Non-custodial: users control their funds
- Email login with secure key management via Privy
- No seed phrases required

## Development

### Project Structure

```
defi-borrowing-app/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/
│   │   ├── actions/         # Action forms (deposit, swap, borrow)
│   │   ├── auth/            # Auth components
│   │   ├── dashboard/       # Dashboard widgets
│   │   └── ui/              # UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, constants, ABIs
│   └── types/               # TypeScript types
├── public/                  # Static assets
└── package.json
```

### Key Hooks

- `useSmartWallet`: Manages Biconomy smart wallet
- `useTokens`: Token balances and allowances
- `useMorpho`: Morpho position and market data

### Adding New Features

1. Create components in `src/components/`
2. Add hooks in `src/hooks/`
3. Update constants in `src/lib/constants.ts`
4. Add ABIs in `src/lib/abis.ts`

## Production Deployment

1. Set up production environment variables
2. Configure your domain in Privy dashboard
3. Set up Biconomy paymaster for production
4. Deploy to Vercel or your preferred platform:

```bash
npm run build
```

## License

MIT

## Support

For support, please open an issue in the GitHub repository.
