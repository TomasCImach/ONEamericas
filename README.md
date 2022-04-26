# Volatile token for the ONEAM Project

To develop a token on Celo to spend, save and stake and a stablecoin token pegged to USD. 

1. A volatile token for the  ecosystem with a genesis supply of 100BN that will be distributed transparently. In the future it can also be used to charge fees for certain operations or services that can be redistributed to maintain the ecosystem. 

Volatile token
**Milestone 1: Due 15/04/22**
# - Compliance with wallet standards based on ERC-20 
# - On deployement, transfer all supply to treasuryAddress. 
# - Add burning functionalities so the token can be burned when it is decided to do so - AccessControl with BURNER_ROLE
# - Add TAX mechanism and distribution to Pools

**Milestone 2: Due 22/04/22**
# Add mechanisms and standards that make gasless transactions possible for end-users like EIP-2612, EIP-2771 and other types of meta-transactions
# Add multicall functionality to execute different token operations in one transaction, for example to transfer to more than one account in a same transaction, handy for distribution processes

Make Upgradable

Chain -         Celo
# Name -          ONEamericas
# Symbol -        ONEAM
# Max Supply -    100 BN - Done with _mint on constructor
# Decimals -      18
# Gas -           Own Currency
# TAX -           0,5% to Liquidity Pool = liquidityTax / baseTax 
#                 0,5% to Staking Pool = stakingTax / baseTax 
# Whitelisted wallets - no TAX from/to


Consult:
Modified burn cappabilities