// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Proxy.sol";

contract ProxyFactory {
    event ProxyCreated(address proxy);

    address public immutable logic;

    constructor(address _logic) {
        logic = _logic;
    }

    function createProxy(address owner) external returns (address) {
        Proxy proxy = new Proxy(logic);
        (bool ok, ) = address(proxy).call(
            abi.encodeWithSignature("initialize(address)", owner)
        );
        require(ok, "init failed");
        emit ProxyCreated(address(proxy));
        return address(proxy);
    }
}
