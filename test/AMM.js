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

    // Use the await method & look in ethers library and use the getContractFactory method with the Token contract as an argument
    const Token = await ethers.getContractFactory('Token')

    // Use the await method & look in Token contract and use the deploy method with the following arguments
    token1 = await Token.deploy('Saucy Sam', 'SSM', '1000000')
    token2 = await Token.deploy('USD Token', 'USD', '1000000')

    // ------------------------------------------------
    // Send from deployer to liquidity provider
    // ------------------------------------------------

    // Token 1
    // ------------------------------------------------

    // Use the await method & take token1 & token2 contracts and use the connect method with the deployer as an argument, then use the transfer method with the liquidity provider address and 100k tokens as arguments to send 100k of token1 & token2 to the liquidity provider
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

    // Use the await method with ethers and use the getContractFactory method with the AMM contract as an argument
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

  describe('\nSwapping Tokens', () => {

    // Swap Variables
    let amount,
        transaction,
        result,
        estimate,
        balance

    it('facilitates swaps', async () => {
      
      // Assign amount of tokens to variable
      amount = tokens(100000)

      // ------------------------------------------------
      // Deployer approves AMM to spend 100k tokens
      // ------------------------------------------------

      // Use the await method with token1 & token2 contracts and use the connect method with the deployer as an argument, then use the approve method with the amm address and 100k tokens as arguments to approve the AMM to spend 100k of token1 & token2
      transaction = await token1.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      // ------------------------------------------------
      // Deployer provides liquidity to AMM
      // ------------------------------------------------

      // Use the await method with the AMM contract and use the connect method with the deployer as an argument, then use the addLiquidity method with the amount as an argument to add 100k of token1 & token2 to the AMM
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
      // console.log(await amm.K())

      // ------------------------------------------------
      // Check deployer's liquidity
      // ------------------------------------------------

      // Use the await method with the amm shares method with the deployer address as an expected argument to check if the deployer has 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100))

      // Check pool shares
      // Use await method with the amm contract totalShares method to equal 100 shares
      let totalShares = await amm.totalShares()
      expect(totalShares).to.equal(tokens(100))

      // ------------------------------------------------
      // LP provides additional liquidity to AMM contract
      // ------------------------------------------------
      amount = tokens(50000)

      // Use the await method with the token1 & token2 contracts & use the connect method with the liquidity provider address as an argument, then use the approve method with the AMM contract address & amount as arguments to spend 50k of token1 & token2
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

      // ------------------------------------------------
      // Investor1 swaps tokens
      // ------------------------------------------------
      // 1. Check price before swap
      // 2. Investor1 approves all tokens
      // 3. Check Investor1 token1 balance before swap
      // 4. Estimate amount of tokens investor1 will receive after swapping token1 including slippage
      // 5. Investor1 performs swap
      // 6. Check swap event
      // 7. Check Investor1 token1 balance after swap
      // 8. Check AMM token balances are in sync
      // 9. Check price after swap
      // ------------------------------------------------

      // Check price before swap
      console.log(`\nPrice before swap: ${await amm.token2Balance() / await amm.token1Balance()}`)

      // Investor1 approves all tokens
      transaction = await token1.connect(investor1).approve(amm.address, tokens(100000))

      // Check Investor1 token1 balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`\nInvestor1 token2 balance before swap: ${ethers.utils.formatUnits(balance)}`)

      // Estimate amount of tokens investor1 will receive after swappnig token1 including slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(`Investor1 estimated token2 swap: ${ethers.utils.formatUnits(estimate)}`)

      // Investor1 swaps 1 token1 for token2
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      result = await transaction.wait()

      // Check Swap event
      await expect(transaction).to.emit(amm, 'Swap')
      .withArgs(
        investor1.address,
        token1.address,
        tokens(1),
        token2.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),

        // Using the await method with ethers and the provider method and the getBlock method with the await method as an argument with the await method as an argument of the getBlockNumber method to get the timestamp of the block
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )

      // Check Investor1 token1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 token2 balance after swap: ${ethers.utils.formatUnits(balance)}\n`)
      expect(estimate).to.equal(balance)

      // ------------------------------------------------
      // Check AMM token balances are in sync
      // ------------------------------------------------

      // Use the expect method with the await method as an argument with the token contract balanceOf method with the AMM contract address as an argument to check if the token contract balances are in sync using the await method as an argument of the equal method & the amm contract tokenBalance methods
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check price after swap
      console.log(`Price after swap: ${await amm.token2Balance() / await amm.token1Balance()} \n`)

      // ------------------------------------------------
      // Investor1 swaps again
      // ------------------------------------------------

      // Check Investor1 token1 balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 token2 balance before swap: ${ethers.utils.formatUnits(balance)}`)

      // Estimate amount of tokens investor1 will receive after swapping token1 including slippage
      estimate = await amm.calculateToken1Swap(tokens(1))

      // Investor1 swaps 1 token1 for token2
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      await transaction.wait()

      // Check Investor1 token1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 token2 balance after swap: ${ethers.utils.formatUnits(balance)}\n`)

      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check price after swap
      console.log(`Price after swap: ${await amm.token2Balance() / await amm.token1Balance()} \n`)

      // ------------------------------------------------
      // Investor1 swaps a large amount
      // ------------------------------------------------

      // Check Investor1 token1 balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 token2 balance before swap: ${ethers.utils.formatUnits(balance)}`)

      // Estimate amount of tokens investor1 will receive after swapping token1 including slippage
      estimate = await amm.calculateToken1Swap(tokens(100))

      // Investor1 swaps 100 token1 for token2
      transaction = await amm.connect(investor1).swapToken1(tokens(100))
      await transaction.wait()

      // Check Investor1 token1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 token2 balance after swap: ${ethers.utils.formatUnits(balance)}\n`)

      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check price after swap
      console.log(`Price after swap: ${await amm.token2Balance() / await amm.token1Balance()} \n`)

      // ------------------------------------------------
      // Investor2 swaps tokens
      // ------------------------------------------------

      // Investor2 approves all tokens
      transaction = await token2.connect(investor2).approve(amm.address, tokens(100000))
      await transaction.wait()

      // Check Investor2 token1 balance before swap
      balance = await token1.balanceOf(investor2.address)
      console.log(`Investor2 token1 balance before swap: ${ethers.utils.formatUnits(balance)}`)

      // Estimate amount of tokens investor2 will receive after swapping token2 including slippage
      estimate = await amm.calculateToken2Swap(tokens(1))
      console.log(`Investor2 estimated token1 swap: ${ethers.utils.formatUnits(estimate)}`)

      // Investor2 swaps 1 token2 for token1
      transaction = await amm.connect(investor2).swapToken2(tokens(1))
      await transaction.wait()

      // Check swap event
      await expect(transaction).to.emit(amm, 'Swap')
        .withArgs(
          investor2.address,
          token2.address,
          tokens(1),
          token1.address,
          estimate,
          await amm.token1Balance(),
          await amm.token2Balance(),
          (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
        )

      // Check Investor2 token1 balance after swap
      balance = await token1.balanceOf(investor2.address)
      console.log(`Investor2 token1 balance after swap: ${ethers.utils.formatUnits(balance)}\n`)
      expect(estimate).to.equal(balance)

      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check price after swap
      console.log(`Price after swap: ${await amm.token2Balance() / await amm.token1Balance()} \n`)
    })
  })
})
