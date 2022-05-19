// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract ONEUSDollar is ERC20, Pausable, AccessControl, ERC20Permit, ERC2771Context {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MASTER_MINTER_ROLE = keccak256("MASTER_MINTER_ROLE");
    bytes32 public constant BLACKLISTED_ROLE = keccak256("BLACKLISTED_ROLE");

    mapping(address => bool) internal minters;
    mapping(address => uint256) internal minterAllowed;

    event MinterConfigured(address indexed minter, uint256 minterAllowedAmount);
    event MinterRemoved(address indexed oldMinter);
    event MasterMinterChanged(address indexed newMasterMinter);

    constructor(MinimalForwarder forwarder) ERC20("ONE US Dollar", "ONEUSD") ERC20Permit("ONE US Dollar") ERC2771Context(address(forwarder)) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MASTER_MINTER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function minterAllowance(address minter) external view returns (uint256) {
        return minterAllowed[minter];
    }

    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    function bulkTransfer(address[] memory to, uint256[] memory amount) external returns (bool) {
        address owner = _msgSender();
        require(to.length == amount.length);
        uint256 totalAmount;
        for (uint256 i = 0; i < amount.length; i++) {
            totalAmount += amount[i];
        }
        uint256 fromBalance = balanceOf(owner);
        require(fromBalance >= totalAmount, "ERC20: transfer amount exceeds balance");
        for (uint256 i = 0; i < to.length; i++) {
            _transfer(owner, to[i], amount[i]);
        }
        return true;
    }

    function mint(address to, uint256 amount) public {
        require(!hasRole(BLACKLISTED_ROLE, _msgSender()) && !hasRole(BLACKLISTED_ROLE, to), "Blacklisted");
        require(minters[_msgSender()], "Minter not configured");
        require(amount > 0, "Amount must be greater than 0");

        uint256 allowedAmount = minterAllowed[_msgSender()];
        require(amount <= allowedAmount, "Mint amount exceeds minterAllowance");
        minterAllowed[_msgSender()] = allowedAmount - amount;

        _mint(to, amount);
    }

    function burn(uint256 amount) external whenNotPaused {
        require(!hasRole(BLACKLISTED_ROLE, _msgSender()), "Blacklisted");
        require(minters[_msgSender()], "Minter not configured");
        require(amount > 0, "Burn amount not greater than 0");

        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual {
        require(!hasRole(BLACKLISTED_ROLE, _msgSender()) && !hasRole(BLACKLISTED_ROLE, account), "Blacklisted");
        require(minters[account], "Minter not configured");
        require(amount > 0, "Burn amount not greater than 0");

        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function configureMinter(address minter, uint256 minterAllowedAmount) external whenNotPaused onlyRole(MASTER_MINTER_ROLE) returns (bool) {
        minters[minter] = true;
        minterAllowed[minter] = minterAllowedAmount;
        emit MinterConfigured(minter, minterAllowedAmount);
        return true;
    }

    function increaseMinterAllowance(address minter, uint256 amount) external whenNotPaused onlyRole(MASTER_MINTER_ROLE) returns (bool) {
        require(minters[minter], "Minter not configured");
        minterAllowed[minter] += amount;
        emit MinterConfigured(minter, minterAllowed[minter]);
        return true;
    }

    function decreaseMinterAllowance(address minter, uint256 amount) external whenNotPaused onlyRole(MASTER_MINTER_ROLE) returns (bool) {
        require(minters[minter], "Minter not configured");
        require(minterAllowed[minter] >= amount, "Minter allowance cannot be decreased below 0");
        minterAllowed[minter] -= amount;
        emit MinterConfigured(minter, minterAllowed[minter]);
        return true;
    }

    function removeMinter(address minter) external onlyRole(MASTER_MINTER_ROLE) returns (bool) {
        require(minters[minter], "Minter not configured");
        minters[minter] = false;
        minterAllowed[minter] = 0;
        emit MinterRemoved(minter);
        return true;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal whenNotPaused override {
        require(!hasRole(BLACKLISTED_ROLE, from) && !hasRole(BLACKLISTED_ROLE, to), "Blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }

    function setBlacklist(address account, bool blacklist) public onlyRole(ADMIN_ROLE) {
        if (blacklist) {
            require(!hasRole(BLACKLISTED_ROLE, account), "Already blacklisted");
            _grantRole(BLACKLISTED_ROLE, account);
        } else {
            require(hasRole(BLACKLISTED_ROLE, account), "Not blacklisted");
            _revokeRole(BLACKLISTED_ROLE, account);
        }
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}