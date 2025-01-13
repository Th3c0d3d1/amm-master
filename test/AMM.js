const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

describe('AMM', () => {

  // Contract Variables
  let accounts,
      deployer,
      liquidityProvider,
      investor1,
      investor2

  // Token Variables
  let token1,
      token2,
      amm

  beforeEach(async () => {
    // ------------------------------------------------
    // Setup Accounts
    // ------------------------------------------------

    // Look in ethers and use the getSigners method
    accounts = await ethers.getSigners()

    // Assign account variables
    deployer = accounts[0]
    liquidityProvider = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]

    // ------------------------------------------------
    // Deploy Tokens to be used in AMM Contact (deployer)
    // ------------------------------------------------

    // Look in ethers and use the getContractFactory method with the Token contract as an argument
    const Token = await ethers.getContractFactory('Token')

    // Look in Token contract and use the deploy method with the following arguments
    token1 = await Token.deploy('Saucy Sam', 'SSM', '1000000')
    token2 = await Token.deploy('USD Token', 'USD', '1000000')

    // ------------------------------------------------
    // Send from deployer to liquidity provider
    // ------------------------------------------------

    // Token 1
    // ------------------------------------------------

    // Take token1 & token2 contracts and use the connect method with the deployer as an argument, then use the transfer method with the liquidity provider address and 100k tokens as arguments to send 100k of token1 & token2 to the liquidity provider
    let transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // Token 2
    // ------------------------------------------------
    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // ------------------------------------------------
    // Send tokens to investors
    // ------------------------------------------------

    // Send token1
    // ------------------------------------------------

    // Take token1 & token2 contracts and use the connect method with the deployer as an argument, then use the transfer method with the investor1 address and 100k tokens as arguments to send 100k tokens to investor1 & investor2
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    // Send token2 to investor2
    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()

    // ------------------------------------------------
    // Deploy AMM
    // ------------------------------------------------

    // Deposit token1 & token2 into AMM
    // ------------------------------------------------

    // Look in ethers and use the getContractFactory method with the AMM contract as an argument
    const AMM = await ethers.getContractFactory('AMM')

    // Use the await method with the AMM contract deploy method with token1 & token2 addresses as arguments to deploy the AMM contract
    amm = await AMM.deploy(token1.address, token2.address)
  })

  describe('Deployment', () => {

    // ------------------------------------------------
    // Check for AMM contract deployment
    // ------------------------------------------------

    it('has an address', async () => {

      // Use the expect method with the amm contract address as an argument to check if the address is not equal to 0x0
      expect(amm.address).to.not.equal(0x0)
    })

    // ------------------------------------------------
    // Check for token addresses
    // ------------------------------------------------

    // Token1
    it('tracks token1 address', async () => {

      // Use the await method with the amm contract token1 method as an expected argument to check if the token1 address is equal to the token1 address
      expect(await amm.token1()).to.equal(token1.address)
    })

    // Token2
    it('tracks token2 address', async () => {
      expect(await amm.token2()).to.equal(token2.address)
    })
  })

  describe('Swapping Tokens', () => {

    // Swap Variables
    let amount,
        transaction,
        result

    it('facilitates swaps', async () => {
      
      // Assign amount of tokens to variable
      amount = tokens(100000)

      // ------------------------------------------------
      // Deployer approves AMM to spend 100k tokens
      // ------------------------------------------------

      // Take token1 & token2 and use the connect method with the deployer as an argument, then use the approve method with the amm address and 100k tokens as arguments to approve the AMM to spend 100k of token1 & token2
      transaction = await token1.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      // ------------------------------------------------
      // Deployer provides liquidity to AMM
      // ------------------------------------------------

      // Take the AMM contract and use the connect method with the deployer as an argument, then use the addLiquidity method with the amount as an argument to add 100k of token1 & token2 to the AMM
      transaction = await amm.connect(deployer).addLiquidity(amount, amount)
      await transaction.wait()

      // ------------------------------------------------
      // Check if AMM contract has liquidity
      // ------------------------------------------------

      // Use the await method with the token1 & token2 balance of the AMM address as an expected argument to check if the AMM has 100k of token1 & token2
      expect(await token1.balanceOf(amm.address)).to.equal(amount)
      expect(await token2.balanceOf(amm.address)).to.equal(amount)

      expect(await amm.token1Balance()).to.equal(amount)
      expect(await amm.token2Balance()).to.equal(amount)

      // Check if AMM has shares
      console.log(await amm.K())

      // ------------------------------------------------
      // Check deployer's liquidity
      // ------------------------------------------------

      // Use the await method with the amm shares method with the deployer address as an expected argument to check if the deployer has 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100))

      // Check pool shares
      expect(await amm.totalShares()).to.equal(tokens(100))

      // ------------------------------------------------
      // LP provides additional liquidity to AMM contract
      // ------------------------------------------------
      amount = tokens(50000)

      // Use the await method with the token1 & token2 contract balance with the liquidity provider address as an argument to approve the AMM contract address to spend 50k of token1 & token2
      transaction = await token1.connect(liquidityProvider).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(liquidityProvider).approve(amm.address, amount)
      await transaction.wait()

      // Calculate token2 deposit amount
      let token2Deposit = await amm.calculateToken2Deposit(amount)

      // LP provides liquidity to AMM
      transaction = await amm.connect(liquidityProvider).addLiquidity(amount, token2Deposit)
      await transaction.wait()

      // Check if AMM has liquidity (50 shares)
      expect(await amm.shares(liquidityProvider.address)).to.equal(tokens(50))

      // Deployer should still have 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100))

      // Pool shares should be 150
      expect(await amm.totalShares()).to.equal(tokens(150))
    })
  })
})
