#!/bin/bash

# 启用nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 切换到 Node.js 22 版本
nvm use 22

# 获取 Hardhat 可执行文件的路径
HARDHAT_PATH="./node_modules/.bin/hardhat"

# 执行 Hardhat 编译命令
node "$HARDHAT_PATH" compile

# 将 Hardhat 的退出码作为脚本的退出码
exit $?