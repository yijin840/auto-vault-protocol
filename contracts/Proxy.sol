// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 代理合约（Minimal Proxy）
contract Proxy {
    address public logic;
    address public owner;
    bool private initialized;

    event Initialized(address owner);

    constructor(address _logic) {
        logic = _logic;
    }

    /// 初始化方法，只能调用一次
    function initialize(address _owner) external {
        require(!initialized, "Proxy: already initialized");
        owner = _owner;
        initialized = true;
        emit Initialized(_owner);
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
