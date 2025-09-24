// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./interfaces/IVault.sol";
import "./interfaces/IERC20.sol";
// 逻辑合约
contract Vault is IVault {
    address public owner;

    event Log(string message, address sender);

    function initialize(address _owner) external {
        require(owner == address(0), "already initialized");
        owner = _owner;
    }

    // 提取指定数量的 ETH
    function sweepETH(uint256 amount) external override {
        require(msg.sender == owner, "not owner");
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "transfer failed");
        emit Log("ETH transferred", msg.sender);
    }

    // 提取指定数量的某个 ERC20
    function sweepERC20(address token, uint256 amount) external override {
        require(msg.sender == owner, "not owner");
        // 调用 ERC20 的 transfer 方法
        (bool ok, bytes memory data) =
            token.call(abi.encodeWithSignature("transfer(address,uint256)", owner, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "ERC20 transfer failed");
        emit Log("ERC20 transferred", msg.sender);
    }

    // 将指定 token 列表的全部余额提取给 owner
    function sweepAll(address[] calldata tokens) external override {
        require(msg.sender == owner, "not owner");
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            (bool ok, bytes memory data) = token.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    owner,
                    IERC20(token).balanceOf(address(this))
                )
            );
            require(ok && (data.length == 0 || abi.decode(data, (bool))), "sweepAll failed");
        }
        emit Log("All tokens swept", msg.sender);
    }

    receive() external payable {}
}
