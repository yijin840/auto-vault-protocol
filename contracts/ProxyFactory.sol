// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Proxy.sol";

contract ProxyFactory {
    event ProxyCreated(address proxy);

    // 逻辑合约地址（不可变）
    address public immutable logic;

    constructor(address _logic) {
        require(_logic != address(0), "logic cannot be zero");
        logic = _logic;
    }

    /**
     * @notice 创建一个新的 Proxy 实例，并初始化 owner
     * @param owner TRON Hex41 地址（可带 41 前缀）
     * @return proxy 地址
     */
    function createProxy(address owner) external returns (address) {
        // 创建 Proxy
        Proxy proxy = new Proxy(logic);

        // 转成标准 20 字节地址
        address ownerAddr = address(uint160(uint256(uint160(owner))));

        // 调用 initialize 方法
        (bool ok, bytes memory data) = address(proxy).call(
            abi.encodeWithSignature("initialize(address)", ownerAddr)
        );

        // 捕获失败并尝试解析 revert 原因
        if (!ok) {
            string memory reason = "initialize failed";
            if (data.length > 0) {
                // TRON Solidity revert 消息前 32 字节是长度，跳过
                assembly {
                    reason := add(data, 32)
                }
            }
            revert(reason);
        }

        emit ProxyCreated(address(proxy));
        return address(proxy);
    }
}
