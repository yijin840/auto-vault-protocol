// deploy.js

import hre from "hardhat";
import { TronWeb } from 'tronweb';


async function main() {
    console.log('正在准备部署...');

    // 实例化 TronWeb 来进行地址转换。
    // fullHost 必须与 hardhat.config.js 中的 URL 匹配。
    const tronWeb = new TronWeb({
        fullHost: 'https://api.shasta.tronstack.io',
    });

    // 你的 TRON 地址
    const TRON_ADDRESS = 'TJSiouBApng8Efzmr2etM6xxuDAigr91GQ';

    // 自动将 TRON 地址转换为以太坊地址格式
    const merchantAddress = tronWeb.address.toHex(TRON_ADDRESS);
    console.log(`你的 TRON 地址 (${TRON_ADDRESS}) 已转换为以太坊格式: ${merchantAddress}`);
    console.log('----------------------------------------------------');

    console.log('开始部署合约...');

    // 1. 部署 Vault 逻辑合约
    const Vault = await ethers.getContractFactory('Vault');
    const vault = await Vault.deploy();
    await vault.deployed();
    console.log(`\n✅ Vault 合约已部署到: ${vault.address}`);
  
    // 2. 部署 ProxyFactory 合约
    const ProxyFactory = await ethers.getContractFactory('ProxyFactory');
    const proxyFactory = await ProxyFactory.deploy(vault.address);
    await proxyFactory.deployed();
    console.log(`✅ ProxyFactory 合约已部署到: ${proxyFactory.address}`);

    // 3. 使用 ProxyFactory 创建一个新的代理合约地址
    const proxyTx = await proxyFactory.createProxy(merchantAddress);
    const receipt = await proxyTx.wait();

    // 从事件中获取新创建的代理地址
    const proxyAddress = receipt.events?.filter(
        (x) => x.event === 'ProxyCreated'
    )[0].args.proxy;

    if (!proxyAddress) {
        console.error('❌ 创建代理合约失败，无法获取地址。');
        return;
    }

    console.log(`\n🎉🎉🎉 部署成功！🎉🎉🎉`);
    console.log(`请将以下地址提供给客户收款:`);
    console.log(`👉 收款地址 (代理合约): ${proxyAddress}`);
    console.log(`\n注意：所有转到此地址的 USDT/TRX，都将转入你的最终收款地址: ${merchantAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});