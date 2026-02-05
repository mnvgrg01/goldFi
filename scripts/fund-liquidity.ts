
import { execSync } from 'child_process';
import { createWalletClient, createPublicClient, http, parseAbi, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';

// Configuration
const RPC_URL = 'http://localhost:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil Account #0
const USER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const TOKENS = {
    XAUT0: '0x40461291347e1eCbb09499F3371D3f17f10d7159' as Address, // Token 0
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address,  // Token 1
};

const CONTRACTS = {
    POSITION_MANAGER: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' as Address,
    MORPHO_BLUE: '0x6c247b1F6182318877311737BaC0844bAa518F5e' as Address,
};

// Validated Storage Slot for both tokens on Arbitrum
const STORAGE_SLOT = 51;

// ABIs
const ERC20_ABI = parseAbi([
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
]);

const POS_MGR_ABI = parseAbi([
    'struct MintParams { address token0; address token1; uint24 fee; int24 tickLower; int24 tickUpper; uint256 amount0Desired; uint256 amount1Desired; uint256 amount0Min; uint256 amount1Min; address recipient; uint256 deadline; }',
    'function mint(MintParams params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
]);

const MORPHO_ABI = parseAbi([
    'struct MarketParams { address loanToken; address collateralToken; address oracle; address irm; uint256 lltv; }',
    'function supply(MarketParams marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
]);

function runCast(cmd: string) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (e: any) {
        console.error(`Command failed: ${cmd}`);
        // console.error(e.stderr || e.message);
        return '0'; // Fail gracefully for checks
    }
}

async function runScript() {
    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({
        account,
        chain: arbitrum,
        transport: http(RPC_URL),
    });
    const publicClient = createPublicClient({
        chain: arbitrum,
        transport: http(RPC_URL),
    });

    console.log(`🚀 Funding Liquidity for ${USER_ADDRESS}`);

    // 1. Mint Tokens via Storage (Cast)
    console.log('💰 Minting Tokens via Storage (Slot 51)...');
    const key_usdt = runCast(`cast index address ${USER_ADDRESS} ${STORAGE_SLOT}`);
    const key_xaut = runCast(`cast index address ${USER_ADDRESS} ${STORAGE_SLOT}`);

    // Mint 1M USDT
    runCast(`cast rpc anvil_setStorageAt ${TOKENS.USDT} ${key_usdt} $(cast to-uint256 1000000000000) --rpc-url ${RPC_URL}`);
    // Mint 1000 XAUT0
    runCast(`cast rpc anvil_setStorageAt ${TOKENS.XAUT0} ${key_xaut} $(cast to-uint256 1000000000) --rpc-url ${RPC_URL}`);

    console.log('✅ Tokens Minted.');

    // 2. Approve Position Manager
    console.log('🦄 Adding Uniswap Liquidity...');
    const maxUint = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

    await client.writeContract({
        address: TOKENS.USDT, abi: ERC20_ABI, functionName: 'approve',
        args: [CONTRACTS.POSITION_MANAGER, maxUint],
    });
    await client.writeContract({
        address: TOKENS.XAUT0, abi: ERC20_ABI, functionName: 'approve',
        args: [CONTRACTS.POSITION_MANAGER, maxUint],
    });

    // 3. Mint Position
    // Range: 70000 to 90000
    // Amount0 (XAUT): 100
    // Amount1 (USDT): 300,000
    await client.writeContract({
        address: CONTRACTS.POSITION_MANAGER,
        abi: POS_MGR_ABI,
        functionName: 'mint',
        args: [{
            token0: TOKENS.XAUT0,
            token1: TOKENS.USDT,
            fee: 10000,
            tickLower: 70000,
            tickUpper: 90000,
            amount0Desired: 100000000n, // 100 XAUT
            amount1Desired: 300000000000n, // 300k USDT
            amount0Min: 0n,
            amount1Min: 0n,
            recipient: USER_ADDRESS as Address,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
        }],
    });
    console.log('✅ Uniswap Liquidity Added.');

    // 4. Supply Morpho
    console.log('🦋 Supplying Morpho Liquidity...');
    await client.writeContract({
        address: TOKENS.USDT, abi: ERC20_ABI, functionName: 'approve',
        args: [CONTRACTS.MORPHO_BLUE, maxUint],
    });

    const marketParams = {
        loanToken: TOKENS.USDT,
        collateralToken: TOKENS.XAUT0,
        oracle: '0xADE5f08073E1097242F8E73c51213438D214896E' as Address,
        irm: '0x66F30587FB8D4206918deb78ecA7d5eBbafD06DA' as Address,
        lltv: 770000000000000000n,
    };

    await client.writeContract({
        address: CONTRACTS.MORPHO_BLUE,
        abi: MORPHO_ABI,
        functionName: 'supply',
        args: [marketParams, 100000000000n, 0n, USER_ADDRESS as Address, '0x'], // Supply 100k USDT
    });

    console.log('✅ Morpho Liquidity Supplied.');
    console.log('🎉 Setup Complete!');
}

runScript();
