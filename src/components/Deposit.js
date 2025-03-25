import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers'

import Alert from './Alert'

import {
  addLiquidity,
  loadBalances
} from '../store/interactions'

const Deposit = () => {

  // Getter and setter for token amounts
  const [token1Amount, setToken1Amount] = useState(0)
  const [token2Amount, setToken2Amount] = useState(0)

  const [showAlert, setShowAlert] = useState(false)

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)

  const amm = useSelector(state => state.amm.contract)
  const isDepositing = useSelector(state => state.amm.depositing.isDepositing)
  const isSuccess = useSelector(state => state.amm.depositing.isSuccess)
  const transactionHash = useSelector(state => state.amm.depositing.transactionHash)
  const dispatch = useDispatch()

  // ----------------------------------------------------------------------------------
  //                                    Amount Handler
  // ----------------------------------------------------------------------------------
  const amountHandler = async (e) => {
    if (e.target.id === 'token1') {

      // Set value for token 1
      // Input token 1 amount to calculate token 2 amount required
      setToken1Amount(e.target.value)

      // Fetch value from chain
      // Fetch wei value of token 1
      // Convert token 1 value to wei (parseUnits)
      const _token1Amount = ethers.utils.parseUnits(e.target.value, 'ether')
      const result = await amm.calculateToken2Deposit(_token1Amount)

      // Convert 'results (token 2)' wei value to ether (formatUnits)
      const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setToken2Amount(_token2Amount)
    } else {
      setToken2Amount(e.target.value)

      // Fetch value from chain
      // Fetch wei value of token 2
      // Convert token 2 value to wei (parseUnits)
      const _token2Amount = ethers.utils.parseUnits(e.target.value, 'ether')
      const result = await amm.calculateToken1Deposit(_token2Amount)

      // Convert 'results (token 1)' wei value to ether (formatUnits)
      const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      // Set value for token 1 after calculating token 2
      setToken1Amount(_token1Amount)
    }
  }

  // ----------------------------------------------------------------------------------
  //                                    Deposit Handler
  // ----------------------------------------------------------------------------------
  const depositHandler = async (e) => {

    // Prevent page reload on submit
    e.preventDefault()

    // Hide alert
    setShowAlert(false)

    // Convert token amounts to wei
    const _token1Amount = ethers.utils.parseUnits(token1Amount, 'ether')
    const _token2Amount = ethers.utils.parseUnits(token2Amount, 'ether')

    await addLiquidity(
      provider,
      amm,
      tokens,
      [_token1Amount, _token2Amount],
      dispatch
    )

    // Load balances after depositing
    await loadBalances(amm, tokens, account, dispatch)

    // Show alert
    setShowAlert(true)
  }

  return (
    <div>

      {/* Bootsrap Card - OP */}
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (
          <Form onSubmit={depositHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            <Row>

              {/* Token 1 */}
              <Form.Text className='text-end my-2' muted>
                Balance: {balances[0]}
              </Form.Text>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  id="token1"
                  onChange={(e) => amountHandler(e)}
                  value={token1Amount === 0 ? "" : token1Amount}
                />
                <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">

                  {/* Token 1 Symbol from redux state*/}
                  { symbols && symbols[0] }
                </InputGroup.Text>
              </InputGroup>
            </Row>
            <Row className='my-3'>

              {/* Token 2 */}
              <Form.Text className='text-end my-2' muted>
                Balance:  {balances[1]}
              </Form.Text>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  step="any"
                  id="token2"
                  onChange={(e) => amountHandler(e)}
                  value={token2Amount === 0 ? "" : token2Amount}
                />
                <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">

                  {/* Token 2 Symbol from redux state*/}
                  { symbols && symbols[1] }
                </InputGroup.Text>
              </InputGroup>
            </Row>
            <Row className='my-3'>

              {/* Deposit Button - OP */}
              {isDepositing ? (

                // Spinner for loading (No Button visible) - OP
                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
              ) : (

                // Button for depositing (Button visible) - OP
                <Button type="submit">Deposit</Button>
              )}
            </Row>
          </Form>
        ) : (

          // Placeholder for demonstration - OP
          <p
            className='d-flex justify-content-center align-items-center'
            style={{ height: '300px' }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>

      {isDepositing ? (

        // Alert for deposit Pending - OP
        <Alert
          message={'Deposit Pending...'}
          transactionHash={null}
          variant={'info'}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (

        // Alert for deposit success - OP
        <Alert
          message={'Deposit Successful'}
          transactionHash={transactionHash}
          variant={'success'}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (

        // Alert for deposit failure - OP
        <Alert
          message={'Deposit Failed'}
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

export default Deposit;
