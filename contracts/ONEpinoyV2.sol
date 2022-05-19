// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract ONEpinoyV2 is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, PausableUpgradeable, AccessControlUpgradeable, ERC2771ContextUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant WHITELISTED_ROLE = keccak256("WHITELISTED_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    address public teamPoolAddress;
    address public stakingPoolAddress;
    address public metaFeeAddress;
    uint16 public teamTax;
    uint16 public stakingTax;
    uint16 public baseTax;

    constructor(address trustedForwarder) ERC2771ContextUpgradeable(trustedForwarder) {}

    function initialize() initializer public {
        __ERC20_init("ONEpinoy", "PINOY");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(WHITELISTED_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        teamTax = 5; // 0,5%
        stakingTax = 5; // 0,5%
        baseTax = 1000;

        teamPoolAddress = 0x000000000000000000000000000000000000dEaD;  // test address
        _grantRole(WHITELISTED_ROLE, teamPoolAddress);
        stakingPoolAddress = 0x2222222222222222222222222222222222222222; // test address
        _grantRole(WHITELISTED_ROLE, stakingPoolAddress);
        metaFeeAddress = 0x1111111111111111111111111111111111111111; // test address
        _grantRole(WHITELISTED_ROLE, metaFeeAddress);

        _mint(msg.sender, (625 * 10**9) * 10**18); // Mint Total Supply of 625 Billion $ONEAM to contract deployer
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
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

    // Override _transfer function to set Tax amounts and transfer to Pools
    function _transfer(address from, address to, uint256 amount) internal override {
        uint256 totalAmount = amount;
        if (!hasRole(WHITELISTED_ROLE, from) && !hasRole(WHITELISTED_ROLE, to)) {
            if (teamTax > 0) {
                uint256 teamAmount = totalAmount * teamTax / baseTax;
                super._transfer(from, teamPoolAddress, teamAmount);
                amount = amount - teamAmount;
            }
            if (stakingTax > 0) {
                uint256 stakingAmount = totalAmount * stakingTax / baseTax;
                super._transfer(from, stakingPoolAddress, stakingAmount);
                amount = amount - stakingAmount;
            }
        }
        super._transfer(from, to, amount);
    }

    function metaTransfer(address to, uint256 amount, uint256 fee) public returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        _transfer(owner, metaFeeAddress, fee);
        return true;
    }

    /*      ADMIN_ROLE functions        */
    function setTeamPoolAddress(address newTeamPoolAddress) public onlyRole(ADMIN_ROLE) {
        teamPoolAddress = newTeamPoolAddress;
    }
    function setStakingPoolAddress(address newStakingPoolAddress) public onlyRole(ADMIN_ROLE) {
        stakingPoolAddress = newStakingPoolAddress;
    }
    function setMetaFeeAddress(address newMetaFeeAddress) public onlyRole(ADMIN_ROLE) {
        metaFeeAddress = newMetaFeeAddress;
    }
    function setTeamTax(uint16 newTeamTax) public onlyRole(ADMIN_ROLE) {
        teamTax = newTeamTax;
    }
    function setStakingTax(uint16 newStakingTax) public onlyRole(ADMIN_ROLE) {
        stakingTax = newStakingTax;
    }
    function setBaseTax(uint16 newBaseTax) public onlyRole(ADMIN_ROLE) {
        baseTax = newBaseTax;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal whenNotPaused override {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address sender) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {

    }
}
