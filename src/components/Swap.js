import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers'

import Alert from './Alert'

import {
  swap,
  loadBalances
} from '../store/interactions'

const Swap = () => {

  // Set local in\output state variables
  const [inputToken, setInputToken] = useState(null)
  const [outputToken, setOutputToken] = useState(null)
  const [inputAmount, setInputAmount] = useState(0)
  const [outputAmount, setOutputAmount] = useState(0)

  // Set local price state variable
  const [price, setPrice] = useState(0)

  // Set local alert state variable
  const [showAlert, setShowAlert] = useState(false)

  // Read from the store
  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)

  const amm = useSelector(state => state.amm.contract)
  const isSwapping = useSelector(state => state.amm.swapping.isSwapping)
  const isSuccess = useSelector(state => state.amm.swapping.isSuccess)
  const transactionHash = useSelector(state => state.amm.swapping.transactionHash)

  const dispatch = useDispatch()

  const inputHandler = async (e) => {
    if (!inputToken || !outputToken) {
      window.alert('Please select token')
      return
    }

    if (inputToken === outputToken) {
      window.alert('Invalid token pair')
      return
    }

    if (inputToken === 'SSM') {
      setInputAmount(e.target.value)

      const _token1Amount = ethers.utils.parseUnits(e.target.value, 'ether')
      const result = await amm.calculateToken1Swap(_token1Amount)
      const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setOutputAmount(_token2Amount.toString())

    } else {
      setInputAmount(e.target.value)

      const _token2Amount = ethers.utils.parseUnits(e.target.value, 'ether')
      const result = await amm.calculateToken2Swap(_token2Amount)
      const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setOutputAmount(_token1Amount.toString())
    }

  }

  const swapHandler = async (e) => {
    e.preventDefault()

    setShowAlert(false)

    if (inputToken === outputToken) {
      window.alert('Invalid Token Pair')
      return
    }

    const _inputAmount = ethers.utils.parseUnits(inputAmount, 'ether')

    // Swap token depending upon which one we're doing...
    if (inputToken === "SSM") {
      await swap(provider, amm, tokens[0], inputToken, _inputAmount, dispatch)
    } else {
      await swap(provider, amm, tokens[1], inputToken, _inputAmount, dispatch)
    }

    // Load balances after swapping
    await loadBalances(amm, tokens, account, dispatch)
    await getPrice()

    // Show alert
    setShowAlert(true)
  }

  const getPrice = async () => {
    if (inputToken === outputToken) {
      setPrice(0)
      return
    }

    if (inputToken === 'SSM') {
      setPrice(await amm.token2Balance() / await amm.token1Balance())
    } else {
      setPrice(await amm.token1Balance() / await amm.token2Balance())
    }
  }

  useEffect(() => {
    if(inputToken && outputToken) {
      getPrice()
    }
  }, [inputToken, outputToken]);
  return (
    <div>

      {/* Bootsrap Card - OP*/}
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (

          // Form for swapping tokens - OP
          <Form onSubmit={swapHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            <Row className='my-3'>

              {/* Input token - OP*/}
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Input:</strong></Form.Label>
                <Form.Text muted>
                  Balance: {
                    inputToken === symbols[0] ? (
                      balances[0]
                    ) : inputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>
              </div>

              {/* Input token dropdown - OP*/}
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  onChange={(e) => inputHandler(e) }
                  disabled={!inputToken}
                />

                {/* Input token dropdown button - OP */}
                <DropdownButton
                  variant="outline-secondary"
                  title={inputToken ? inputToken : "Select Token"}
                >

                  {/* Input token dropdown items - OP */}
                  <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >SSM</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >USD</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>
            <Row className='my-4'>

              {/* Output token - OP */}
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Output:</strong></Form.Label>
                <Form.Text muted>
                  Balance: {
                    outputToken === symbols[0] ? (
                      balances[0]
                    ) : outputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>
              </div>

              {/* Output token dropdown - OP */}
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  value={outputAmount === 0 ? "" : outputAmount }
                  disabled
                />

                {/* Output token dropdown button - OP */}
                <DropdownButton
                  variant="outline-secondary"
                  title={outputToken ? outputToken : "Select Token"}
                >

                  {/* Output token dropdown items - OP */}
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>SSM</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>USD</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>
            <Row className='my-3'>

              {/* Swap button - OP */}
              {isSwapping ? (

                // Spinner for loading - OP
                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
              ): (

                // Button for swapping - OP
                <Button type='submit'>Swap</Button>
              )}

              {/* Exchange rate - OP */}
              {/* Exchange rate called from state */}
              <Form.Text muted>
                Exchange Rate: {price}
              </Form.Text>
            </Row>
          </Form>
        ) : (

          // Message to connect wallet - OP
          <p
            className='d-flex justify-content-center align-items-center'
            style={{ height: '300px' }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>

      {isSwapping ? (

        // Alert for pending - OP
        <Alert
          message={'Swap Pending...'}
          transactionHash={null}
          variant={'info'}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (

        // Alert for success - OP
        <Alert
          message={'Swap Successful'}
          transactionHash={transactionHash}
          variant={'success'}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (

        // Alert for failure - OP
        <Alert
          message={'Swap Failed'}
          transactionHash={null}
          variant={'danger'}
          setShowAlert={setShowAlert}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

export default Swap;
