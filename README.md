# Volatile token for the ONE Project

- A volatile token for the  ecosystem with a genesis supply of 100BN that will be distributed transparently. In the future it can also be used to charge fees for certain operations or services that can be redistributed to maintain the ecosystem. 

Volatile token

## Properties
- Chain -         Celo
- Name -          ONEpinoy
- Symbol -        PINOY
- Max Supply -    625 BN - Done with _mint on constructor
- Decimals -      18
- Gas -           Own Currency
- TAX -           
  - 0,5% to Team Pool = teamTax / baseTax 
  - 0,5% to Staking Pool = stakingTax / baseTax 
- Whitelisted wallets - no TAX from/to

## Deployement and Updating instructions

For deployment and updating this Smart Contract we'll be using Upgrades Plugins from OpenZeppelin for Hardhat.

In the proyect directory, after installig the project dependencies:

```
npm install --save-dev @openzeppelin/hardhat-upgrades
npm install --save-dev @nomiclabs/hardhat-ethers ethers
```

**hardhat.config.js**

Add the following lines on the top of the file and put the network details and your Private Key:
```
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
```

### Deploy first version

In the proyect directory:
```
npx hardhat run --network celo scripts/deploy.js
```
In the console you'll read two Contracts Addresses, one for Minimal Forwarder and the other for the project Proxy.

### Deploy Upgrade

Make sure the file **scripts/deployUpgrade.js** has the correct name for the new version of the contract, and put the Minimal Forwarder address.
In the proyect directory:
```
npx hardhat run --network celo scripts/deployUpgrade.js
```
In the console you'll read two Contracts Addresses, one for Proxy (same as before) and the other for the new implementation.

## Admin Role functions

- setTeamPoolAddress: Changes the address where teamTax is transferred.
- setStakingPoolAddress: Changes the address where StakingTax is transferred.
- setMetaFeeAddress: Changes the address where gasless fee transactions are transferred.
- setTeamTax: Changes the teamTax. Tax = teamTax / baseTax.
- setStakingTax: Changes the stakingTax. Tax = stakingTax / baseTax.
- setBaseTax: Changes the base tax with which taxes are calculated.

## Constructor data

Change this before deployement
- teamTax
- stakingTax
- baseTax
- teamPoolAddress
- stakingPoolAddress
- metaFeeAddress
- _mint(amount)

# Stablecoins token for ONE Project

- Stablecoin Token FIAT-collateralized for $USD and $PHP (Philippine Peso).

## Properties
- Chain -         Celo
- Name -          **ASK TEAM**
- Symbol -        **ASK TEAM**
- Max Supply -    Variable
- Decimals -      18
- Gas -           Own Currency
- Mint by role
- Burn by role
- Bulk transfer function
- Blacklist
- NON Upgradeable
- NON Taxable

Contract for Dollar
Name-ONE US Dollar 
Symbol-ONEUSD

Contract for Peso
Name-ONE Philippine Peso
Symbol-ONEPHP

-- Price $3000 for main Stablecoin contract --
-- $500 for each instance (first is free) --

In the case of $USD and $PHP - will be total $3500
If in the future you want to deploy $ARS will be $500


## Todo
