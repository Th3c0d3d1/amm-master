import { useSelector, useDispatch } from 'react-redux'
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Blockies from 'react-blockies'

import logo from '../logo.png';

import { loadAccount, loadBalances } from '../store/interactions'

import config from '../config.json'

const Navigation = () => {
  const chainId = useSelector(state => state.provider.chainId)
  const account = useSelector(state => state.provider.account)
  const tokens = useSelector(state => state.tokens.contracts)
  const amm = useSelector(state => state.amm.contract)

  const dispatch = useDispatch()

  const connectHandler = async () => {
    const account = await loadAccount(dispatch)
    await loadBalances(amm, tokens, account, dispatch)
  }

  const networkHandler = async (e) => {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: e.target.value }],
    })
  }

  return (

    // Bootstrap Navbar component - OP
    <Navbar className='my-3' expand="lg">

      {/* Logo */}
      <img
        alt="logo"
        src={logo}
        width="40"
        height="40"
        className="d-inline-block align-top mx-3"
      />

      {/* Brand */}
      <Navbar.Brand href="#">Saucy Sam AMM</Navbar.Brand>
      <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav" className="justify-content-end">

        <div className="d-flex justify-content-end mt-3">

          {/* Network Selector dropdown - OP */}
          <Form.Select
            aria-label="Network Selector"
            value={config[chainId] ? `0x${chainId.toString(16)}` : `0`}
            onChange={networkHandler}
            style={{ maxWidth: '200px', marginRight: '20px' }}
          >
            <option value="0" disabled>Select Network</option>
            <option value="0x7A69">Localhost</option>
            <option value="0x5">Goerli</option>
          </Form.Select>

          {account ? (

            // Account display - OP
            <Navbar.Text className='d-flex align-items-center'>
              {account.slice(0, 5) + '...' + account.slice(38, 42)}

              {/* Blockies identicon - OP */}
              <Blockies
                seed={account}
                size={10}
                scale={3}
                color="#2187D0"
                bgColor="#F1F2F9"
                spotColor="#767F92"
                className="identicon mx-2"
              />
            </Navbar.Text>
          ) : (

            // Connect button - OP
            <Button onClick={connectHandler}>Connect</Button>
          )}
        </div>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default Navigation;
