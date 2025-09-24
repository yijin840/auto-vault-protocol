// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IVault {
    function sweepETH(uint256 amount) external;
    function sweepERC20(address token, uint256 amount) external;
    function sweepAll(address[] calldata tokens) external;
}
