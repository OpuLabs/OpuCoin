# OpuCoin
Smart-contracts for the token distribution of Opu Labs ICO.

* Vesting.sol
A vesting contract to store tokens for a year period and then release it in full or in 12 batches of 1/12th total assigned tokens.

* ColdStorage.sol
A holding contract that keeps the tokens for two full years, then releases them altogether to a pre-defined address. 

* OPUCoin.sol
An ERC20 token contract. Mints 1.5 billion tokens exactly once, to specified addresses.

* Allocation.sol
A contract to be used by the backend to perform the initial token distribution after the crowdsale.

- Mint 550M tokens to backend address
- Vest 550M tokens to team vesting addresses
- Holding 75M tokens to cold storage address
- Mint 175M tokens to partner addresses
- Mint 150M tokens to rewards addresses 

Crowd sale end date: 12/20/2018

