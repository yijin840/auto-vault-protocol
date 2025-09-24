const TronWeb = require('tronweb')
require('dotenv').config()
const fs = require('fs')
const path = require('path')

// 初始化 TronWeb
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: process.env.TRON_PRIVATE_KEY,
    timeout: 10000,
})

console.log(
    '私钥对应的地址:',
    tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY)
)
console.log('你配置的 TRON_ADDRESS:', process.env.TRON_ADDRESS)

/**
 * 辅助函数：读取合约编译文件并验证
 * @param {string} contractName
 * @returns {Promise<{abi: Array, bytecode: string}>}
 */
async function getArtifact(contractName) {
    const artifactPath = path.join(
        __dirname,
        `../artifacts/contracts/${contractName}.sol/${contractName}.json`
    )
    console.log(`读取合约文件: ${artifactPath}`)
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`合约文件不存在: ${artifactPath}`)
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
    if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) {
        throw new Error(`${contractName} ABI 不合法或为空: ${JSON.stringify(artifact.abi)}`)
    }
    const bytecode = artifact.bytecode && artifact.bytecode.startsWith('0x')
        ? artifact.bytecode
        : '0x' + (artifact.bytecode || '')
    if (!bytecode || bytecode === '0x') {
        throw new Error(`${contractName} 字节码为空或不合法`)
    }

    console.log(`${contractName} ABI 和字节码加载成功，字节码长度: ${bytecode.length}`)
    return { abi: artifact.abi, bytecode }
}

async function main() {
    console.log('准备部署...')

    const TRON_ADDRESS = process.env.TRON_ADDRESS
    if (!TRON_ADDRESS) {
        throw new Error('TRON_ADDRESS 未配置')
    }
    const merchantAddressHex = tronWeb.address.toHex(TRON_ADDRESS)
    console.log(`TRON 地址转换为十六进制格式: ${merchantAddressHex}`)
    console.log('验证地址有效性:', tronWeb.isAddress(tronWeb.address.fromHex(merchantAddressHex)))

    // 检查账户余额和资源
    const balance = await tronWeb.trx.getBalance(TRON_ADDRESS)
    console.log('TRX 余额:', balance / 1e6, 'TRX')
    if (balance < 1e6) {
        throw new Error('账户余额不足，无法部署合约')
    }

    const accountResources = await tronWeb.trx.getAccountResources(TRON_ADDRESS)
    console.log('账户资源:', JSON.stringify(accountResources, null, 2))
    if (!accountResources.EnergyLimit || accountResources.EnergyLimit < 200000) {
        console.warn('警告: 账户能量可能不足，建议冻结 20-50 TRX 获取能量')
    }

    // 读取 Vault 合约
    console.log('读取 Vault 合约文件...')
    const vaultArtifact = await getArtifact('Vault')

    // 部署 Vault 合约
    console.log('部署 Vault 合约...')
    let vaultContract
    try {
        vaultContract = await tronWeb.contract().new({
            abi: vaultArtifact.abi,
            bytecode: vaultArtifact.bytecode,
            feeLimit: 500_000_000,
            callValue: 0,
            userFeePercentage: 50,
            parameters: [],
        })
        console.log('Vault 部署完成，地址:', vaultContract.address)

        // 检查 Vault 状态（根据你的合约调整函数名）
        const vaultInstance = tronWeb.contract(vaultArtifact.abi, vaultContract.address)
        try {
            const owner = await vaultInstance.getOwner().call() // 假设有 getOwner 函数
            console.log('Vault 合约拥有者:', owner)
        } catch (err) {
            console.warn('无法检查 Vault 状态，可能需要初始化:', JSON.stringify(err, null, 2))
        }
    } catch (err) {
        console.error('Vault 部署失败:', JSON.stringify(err, null, 2))
        throw err
    }

    // 读取 ProxyFactory 合约
    console.log('读取 ProxyFactory 合约文件...')
    const proxyFactoryArtifact = await getArtifact('ProxyFactory')

    // 部署 ProxyFactory 合约
    console.log('部署 ProxyFactory 合约...')
    let proxyFactoryContract
    try {
        proxyFactoryContract = await tronWeb.contract().new({
            abi: proxyFactoryArtifact.abi,
            bytecode: proxyFactoryArtifact.bytecode,
            feeLimit: 500_000_000,
            callValue: 0,
            userFeePercentage: 50,
            parameters: [tronWeb.address.toHex(vaultContract.address)],
        })
        console.log('ProxyFactory 部署完成，地址:', proxyFactoryContract.address)
    } catch (err) {
        console.error('ProxyFactory 部署失败:', JSON.stringify(err, null, 2))
        throw err
    }

    // 创建代理合约
    console.log('创建代理合约，参数:', merchantAddressHex)
    try {
        const tx = await proxyFactoryContract
            .createProxy(merchantAddressHex)
            .send({
                feeLimit: 1000_000_000,
                callValue: 0,
                shouldPollResponse: true,
            })
        console.log('代理合约创建交易完成，TxID:', tx)
    } catch (err) {
        console.error('创建代理合约失败:', JSON.stringify(err, null, 2))
        throw err
    }

    // 获取最新 ProxyCreated 事件
    console.log('查询 ProxyCreated 事件...')
    const maxRetries = 5
    let events = []
    for (let i = 0; i < maxRetries; i++) {
        try {
            events = await proxyFactoryContract.getPastEvents('ProxyCreated', {
                fromBlock: tronWeb.defaultBlock - 200,
                toBlock: 'latest',
            })
            if (events.length > 0) {
                console.log(`成功找到事件，重试次数: ${i + 1}`)
                break
            }
            console.log(`未找到事件，第 ${i + 1} 次重试...`)
            await new Promise((resolve) => setTimeout(resolve, 5000))
        } catch (err) {
            console.error(`事件查询失败，第 ${i + 1} 次重试:`, JSON.stringify(err, null, 2))
        }
    }

    if (!events.length) {
        throw new Error('多次尝试后仍未找到 ProxyCreated 事件')
    }

    const proxyAddress = events[events.length - 1].result.proxy
    console.log('代理合约地址:', proxyAddress)
}

main().catch((err) => {
    console.error('部署失败:', JSON.stringify(err, null, 2))
    process.exit(1)
})