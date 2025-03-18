import { ethers } from 'ethers'

// These functions are used to trigger actions in the reducer
// They are called in the App.js file
// They are used to interact with the blockchain and update the state

// Importing the provider actions from the reducers
import {
  setProvider,
  setNetwork,
  setAccount
} from './reducers/provider'

// Importing the token actions from the reducers
import {
  setContracts,
  setSymbols,
  balancesLoaded
} from './reducers/tokens'

// Importing the amm actions from the reducers
import {
  setContract,
  sharesLoaded,
  swapsLoaded,
  depositRequest,
  depositSuccess,
  depositFail,
  withdrawRequest,
  withdrawSuccess,
  withdrawFail,
  swapRequest,
  swapSuccess,
  swapFail
} from './reducers/amm'

// Importing the Token and AMM ABI
import TOKEN_ABI from '../abis/Token.json';
import AMM_ABI from '../abis/AMM.json';
import config from '../config.json';

// ------------------------------------------------------------------------------
//                                LOAD PROVIDER
// ------------------------------------------------------------------------------

// Calls dispatch function to update the provider slice of the state
// Returns a provider object that is used to interact with the blockchain
export const loadProvider = (dispatch) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)

  // Dispatch the setProvider action to update provider arg of the provider slice of the state
  dispatch(setProvider(provider))

  return provider
}

// ------------------------------------------------------------------------------
//                                LOAD NETWORK
// ------------------------------------------------------------------------------

// Calls dispatch function to update the chainId in the provider slice of the state
// Returns the chainId of the current network
export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork()

  // Dispatch the setNetwork action to update the chainId arg of the provider slice of the state
  dispatch(setNetwork(chainId))

  return chainId
}

// ------------------------------------------------------------------------------
//                                LOAD ACCOUNT
// ------------------------------------------------------------------------------

// Calls dispatch function to update the account in the provider slice of the state
// Returns the account address
export const loadAccount = async (dispatch) => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const account = ethers.utils.getAddress(accounts[0])

  // Dispatch the setAccount action to update the account arg of the provider slice of the state
  dispatch(setAccount(account))

  return account
}

// ------------------------------------------------------------------------------
//                                LOAD CONTRACTS
// ------------------------------------------------------------------------------

// Calls dispatch function to update the contracts and symbols in the tokens slice of the state
// Returns the contract objects and symbols
export const loadTokens = async (provider, chainId, dispatch) => {
  const dapp = new ethers.Contract(config[chainId].dapp.address, TOKEN_ABI, provider)
  const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider)

  // Dispatch the setContracts action to update the contracts arg of the tokens slice of the state
  dispatch(setContracts([dapp, usd]))

  // Dispatch the setSymbols action to update the symbols arg of the tokens slice of the state
  dispatch(setSymbols([await dapp.symbol(), await usd.symbol()]))
}

// ------------------------------------------------------------------------------
//                                LOAD AMM
// ------------------------------------------------------------------------------

// Calls dispatch function to update the contract in the amm slice of the state
// Returns the AMM contract object
export const loadAMM = async (provider, chainId, dispatch) => {
  const amm = new ethers.Contract(config[chainId].amm.address, AMM_ABI, provider)

  // Dispatch the setContract action to update the contract arg of the amm slice of the state
  dispatch(setContract(amm))

  return amm
}

// ------------------------------------------------------------------------------
//                              LOAD BALANCES & SHARES
// ------------------------------------------------------------------------------

export const loadBalances = async (amm, tokens, account, dispatch) => {
  const balance1 = await tokens[0].balanceOf(account)
  const balance2 = await tokens[1].balanceOf(account)

  // Dispatch the balancesLoaded action to update the balances arg of the tokens slice of the state
  dispatch(balancesLoaded([
    ethers.utils.formatUnits(balance1.toString(), 'ether'),
    ethers.utils.formatUnits(balance2.toString(), 'ether')
  ]))

  const shares = await amm.shares(account)

  // Dispatch the sharesLoaded action to update the shares arg of the amm slice of the state
  dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), 'ether')))
}

// ------------------------------------------------------------------------------
//                                  ADD LIQUDITY
// ------------------------------------------------------------------------------

export const addLiquidity = async (provider, amm, tokens, amounts, dispatch) => {
  try {
    dispatch(depositRequest())

    const signer = await provider.getSigner()

    let transaction

    transaction = await tokens[0].connect(signer).approve(amm.address, amounts[0])
    await transaction.wait()

    transaction = await tokens[1].connect(signer).approve(amm.address, amounts[1])
    await transaction.wait()

    transaction = await amm.connect(signer).addLiquidity(amounts[0], amounts[1])
    await transaction.wait()

    dispatch(depositSuccess(transaction.hash))
  } catch (error) {
    dispatch(depositFail())
  }
}

// ------------------------------------------------------------------------------
//                                REMOVE LIQUDITY
// ------------------------------------------------------------------------------

export const removeLiquidity = async (provider, amm, shares, dispatch) => {
  try {
    dispatch(withdrawRequest())

    const signer = await provider.getSigner()

    let transaction = await amm.connect(signer).removeLiquidity(shares)
    await transaction.wait()

    dispatch(withdrawSuccess(transaction.hash))
  } catch (error) {
    dispatch(withdrawFail())
  }
}

// ------------------------------------------------------------------------------
//                                     SWAP
// ------------------------------------------------------------------------------

export const swap = async (provider, amm, token, symbol, amount, dispatch) => {
  try {

    dispatch(swapRequest())

    let transaction

    const signer = await provider.getSigner()

    transaction = await token.connect(signer).approve(amm.address, amount)
    await transaction.wait()

    if (symbol === "DAPP") {
      transaction = await amm.connect(signer).swapToken1(amount)
    } else {
      transaction = await amm.connect(signer).swapToken2(amount)
    }

    await transaction.wait()

    dispatch(swapSuccess(transaction.hash))

  } catch (error) {
    dispatch(swapFail())
  }
}

// ------------------------------------------------------------------------------
//                                LOAD ALL SWAPS
// ------------------------------------------------------------------------------

export const loadAllSwaps = async (provider, amm, dispatch) => {
  const block = await provider.getBlockNumber()

  const swapStream = await amm.queryFilter('Swap', 0, block)
  const swaps = swapStream.map(event => {
    return { hash: event.transactionHash, args: event.args }
  })

  dispatch(swapsLoaded(swaps))
}
