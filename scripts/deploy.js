// deploy.js

const hre = require("hardhat");

async function main() {
  // --- 配置部分 ---
  // 将这个地址替换为你的最终收款地址。所有客户的钱都会被转到这里。
  const merchantAddress = "0x77E1E5E7b4614138676d9F70e53a9926d83a45c3"; 
  // 这只是一个例子，实际部署时请确保你有足够的 ETH/TRX 来支付 gas
  // -----------------

  console.log("正在部署合约...");

  // 1. 部署 Vault 逻辑合约
  // 这个合约包含了所有业务逻辑
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.deployed();
  console.log(`Vault 合约已部署到: ${vault.address}`);
  
  // 2. 部署 ProxyFactory 合约
  // 这个合约负责创建代理合约，并指向 Vault 逻辑合约
  const ProxyFactory = await hre.ethers.getContractFactory("ProxyFactory");
  const proxyFactory = await ProxyFactory.deploy(vault.address);
  await proxyFactory.deployed();
  console.log(`ProxyFactory 合约已部署到: ${proxyFactory.address}`);

  // 3. 使用 ProxyFactory 创建一个新的代理合约地址
  // 这个地址就是你将提供给客户的收款地址
  const proxyTx = await proxyFactory.createProxy(merchantAddress);
  const receipt = await proxyTx.wait();
  // 从事件中获取新创建的代理地址
  const proxyAddress = receipt.events?.filter((x) => x.event === "ProxyCreated")[0].args.proxy;
  
  if (!proxyAddress) {
    console.error("创建代理合约失败，无法获取地址。");
    return;
  }
  
  console.log(`\n🎉🎉🎉 成功生成收款地址 🎉🎉🎉`);
  console.log(`请将这个地址提供给客户收款: ${proxyAddress}`);
  console.log(`注意：所有转到这个地址的资金，都会被转到你的商户地址: ${merchantAddress}`);
}

// 运行部署脚本
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});