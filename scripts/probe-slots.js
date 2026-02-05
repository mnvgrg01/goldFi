
const { createPublicClient, http, encodeAbiParameters, parseAbiParameters, keccak256 } = require('viem');
const { arbitrum } = require('viem/chains');

const client = createPublicClient({ chain: arbitrum, transport: http('http://localhost:8545') });
const target = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const tokens = {
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    XAUT: '0x40461291347e1eCbb09499F3371D3f17f10d7159'
};

async function probe(tokenName, tokenAddress) {
    console.log(`Probing ${tokenName} (${tokenAddress})...`);
    for (let slot = 0; slot < 100; slot++) {
        const key = keccak256(encodeAbiParameters(parseAbiParameters('address, uint256'), [target, BigInt(slot)]));

        // Call anvil_setStorageAt via fetch
        await fetch('http://localhost:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'anvil_setStorageAt',
                params: [tokenAddress, key, '0x0000000000000000000000000000000000000000000000000000000012345678'],
                id: slot,
                jsonrpc: '2.0'
            })
        });

        // Check balance
        const bal = await client.readContract({
            address: tokenAddress,
            abi: [{ name: 'balanceOf', type: 'function', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [target]
        });

        if (bal === 305419896n) {
            console.log(`FOUND ${tokenName} SLOT: ${slot}`);
            return slot;
        }
    }
    console.log(`Slot not found for ${tokenName}`);
}

(async () => {
    await probe('USDT', tokens.USDT);
    await probe('XAUT', tokens.XAUT);
})();
