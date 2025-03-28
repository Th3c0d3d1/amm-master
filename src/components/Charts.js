import { useSelector, useDispatch } from 'react-redux'
import Table from 'react-bootstrap/Table';

// Cool charts
import Chart from 'react-apexcharts';
import { ethers } from 'ethers'

import { options, series } from './Charts.config';
import { chartSelector } from '../store/selectors';
import { useEffect } from 'react'

import Loading from './Loading';

import {
  loadAllSwaps
} from '../store/interactions'

const Charts = () => {
  const provider = useSelector(state => state.provider.connection)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)

  const amm = useSelector(state => state.amm.contract)

  const chart = useSelector(chartSelector)

  const dispatch = useDispatch()

  useEffect(() => {

    // If provider and amm are available/Changed
    if(provider && amm) {

      // Loads the entire swap history
      loadAllSwaps(provider, amm, dispatch)
    }

    // Detects changes in...
  }, [provider, amm, dispatch])

  return (
    <div>
      
      {/* If provider and amm are available */}
      {provider && amm ? (
        <div>

          {/* Rendering the chart */}
          <Chart
            type="line"
            options={options}

            // If chart is available, use it, otherwise use the default series
            series={chart ? chart.series : series}
            width="100%"
            height="100%"
          />

          <hr />

          {/* Table -OP */}
          <Table striped bordered hover>
            <thead>
              
              {/* Table Headers -OP */}
              <tr>
                <th>Transaction Hash</th>
                <th>Token Give</th>
                <th>Amount Give</th>
                <th>Token Get</th>
                <th>Amount Get</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              
              {/* Mapping through the swaps on the chart */}
              {chart.swaps && chart.swaps.map((swap, index) => (

                // Key is used to identify the element -OP
                <tr key={index}>

                  {/* Getting swap transaction hash */}
                  <td>{swap.hash.slice(0, 5) + '...' + swap.hash.slice(61, 66)}</td>

                  {/* Getting tokens given and tokens received */}
                  {/* Checking if address is associated with symbol ????????????????? */}
                  <td>{swap.args.tokenGive === tokens[0].address ? symbols[0] : symbols[1]}</td>

                  {/* Formatting the amount of tokens given and received */}
                  <td>{ethers.utils.formatUnits(swap.args.tokenGiveAmount.toString(), 'ether')}</td>
                  <td>{swap.args.tokenGet === tokens[0].address ? symbols[0] : symbols[1]}</td>
                  <td>{ethers.utils.formatUnits(swap.args.tokenGetAmount.toString(), 'ether')}</td>

                  {/* Getting truncated user address and Unix timestamp */}
                  <td>{swap.args.user.slice(0, 5) + '...' + swap.args.user.slice(38, 42)}</td>
                  <td>{

                    // Converting Unix timestamp to human readable date and time
                    // Seconds are multiplied by 1000 to convert to milliseconds for JS Date object
                    // String is converted to number
                    // Number is converted to Date object (toLocaleDateString)
                    new Date(Number(swap.args.timestamp.toString() + '000'))
                      .toLocaleDateString(
                        undefined,

                        // Formatting the date and time
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          second: 'numeric'
                        }
                      )
                  }</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

      ) : (

        // If provider and amm are not available
        <Loading/>
      )}

    </div>
  );
}

export default Charts;
