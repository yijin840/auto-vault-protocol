// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// 代理合约（Minimal Proxy）
contract Proxy {
    address public logic;

    constructor(address _logic) {
        logic = _logic;
    }

    // 接收普通 ETH 转账
    receive() external payable {}

    fallback() external payable {
        address _impl = logic;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), _impl, 0, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(0, 0, size)
            switch result
            case 0 { revert(0, size) }
            default { return(0, size) }
        }
    }
}

