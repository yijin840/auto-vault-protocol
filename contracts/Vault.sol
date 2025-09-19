// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 逻辑合约
contract Vault {
    address public owner;

    event Log(string message, address sender);

    function initialize(address _owner) external {
        require(owner == address(0), "already initialized");
        owner = _owner;
    }

    function sweepETH(uint256 amount) external {
        require(msg.sender == owner, "not owner");
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "transfer failed");
        emit Log("ETH transferred", msg.sender);
    }

    receive() external payable {}
}
