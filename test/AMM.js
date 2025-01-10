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
    // Setup Accounts
    accounts = await ethers.getSigners()

    // Assign account variables
    deployer = accounts[0]
    liquidityProvider = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]

    // Deploy Tokens to be used in AMM (deployer)
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Saucy Sam', 'SSM', '1000000') // 1 Million Tokens
    token2 = await Token.deploy('USD Token', 'USD', '1000000') // 1 Million Tokens

    // Send from deployer to liquidity provider
    // Token 1
    let transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()
    // Token 2
    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // Send token1 to investor1
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    // Send token2 to investor2
    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()

    // Deploy AMM
    // Depsit token1 and token2 into AMM
    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)
  })

  describe('Deployment', () => {

    // Check if AMM is deployed
    it('has an address', async () => {
      expect(amm.address).to.not.equal(0x0)
    })

    // Check if AMM has a token1
    it('tracks token1 address', async () => {
      expect(await amm.token1()).to.equal(token1.address)
    })

    // Check if AMM has a token2
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

      // Deployer approves AMM to spend 100k tokens
      transaction = await token1.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2(deployer).approve(amm.address, amount)
      await transaction.wait()
    })
  })
})
