require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const path = require("path");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.30",        // 使用系统已安装的 0.8.30
      },
    ],
    external: {
      compiler: {
        path: path.resolve("/opt/homebrew/bin/solc"), // 本地 solc 路径
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
