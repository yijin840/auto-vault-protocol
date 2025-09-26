// 修改后的硬合约配置 (hardhat.config.js)

import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"; // 使用 "dotenv/config" 来在 ES 模块中加载环境变量
import path from "path";

export default {
  solidity: {
    compilers: [
      {
        version: "0.8.28", // 使用系统已安装的 0.8.28
      },
    ],
    external: {
      compiler: {
        path: "/opt/homebrew/bin/solc", // 直接使用字符串路径
      },
    },
  },
  networks: {
    shasta: {
      url: "https://api.shasta.trongrid.io",
      accounts: [process.env.TRON_PRIVATE_KEY].filter(Boolean),
    },
  },
};