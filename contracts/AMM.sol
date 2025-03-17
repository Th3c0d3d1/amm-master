// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

// [X] App with only 1 trading pair
// [X] Manages liquidity
// [X] Manages swaps (trades)
// [] Manages withdrawals
contract AMM {

// ----------------------------------------------------------------------------------------------------
//                                              Variables
// ----------------------------------------------------------------------------------------------------

    // Calling the Token contract as token1 and token2
    Token public token1;
    Token public token2;

    // Variables to keep track of the balances of the tokens
    uint256 public token1Balance;
    uint256 public token2Balance;

    // Variable to keep track of the LP token balance
    uint256 public K;

    // Total Contract Shares
    // Initial value is 0
    uint256 public totalShares;

    // Used to calculate the precise amount of tokens to be swapped
    uint256 constant PRECISION = 10**18;

// ----------------------------------------------------------------------------------------------------
//                                              Mappings
// ----------------------------------------------------------------------------------------------------

    // Mapping to keep track of the shares of the users
    mapping(address => uint256) public shares;

// ----------------------------------------------------------------------------------------------------
//                                              Events
// ----------------------------------------------------------------------------------------------------

    // Event to emit when a swap occurs
    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );

    event RemoveLiquidity(
        address user,
        uint256 share,
        uint256 token1Amount,
        uint256 token2Amount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );

// ----------------------------------------------------------------------------------------------------
//                                              Functions
// ----------------------------------------------------------------------------------------------------

    // Setting the state variables
    constructor(Token _token1, Token _token2) {
        token1 = _token1;
        token2 = _token2;
    }

//                                  Function to add liquidity to the pool
//                                 ---------------------------------------
    // Deposits tokens
    // Issues shares
    // Manages pool
    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount) external {
        
        // Deposit Tokens
        // 3 Args for transferFrom in Token.sol
        require(
            token1.transferFrom(msg.sender, address(this), _token1Amount),
            "failed to transfer token 1"
        );
        require(
            token2.transferFrom(msg.sender, address(this), _token2Amount),
            "failed to transfer token 2"
        );

        // Issue Shares
        uint256 share;

        // Initial liquidity addition, make share (LP token) worth 100
        if (totalShares == 0) {
            share = 100 * PRECISION;
        } else {

            // Calculate subsequent shares
            uint256 share1 = (totalShares * _token1Amount) / token1Balance;
            uint256 share2 = (totalShares * _token2Amount) / token2Balance;
            require(

                // Check if the share1 and share2 are equal
                // Rounding to 3 decimal places to avoid precision errors
                (share1 / 10**3) == (share2 / 10**3),
                "must provide equal token amounts"
            );
            share = share1;
        }

        // Manage Pool
        token1Balance += _token1Amount;
        token2Balance += _token2Amount;

        // LP Token Balance
        K = token1Balance * token2Balance;

        // Updates shares
        totalShares += share;
        shares[msg.sender] += share;
    }

//                           Functions to calculate the amount of tokens to be deposited
//                           -----------------------------------------------------------

    // Determine how many token2 tokens must be deposited when depositing liquidity for token1
    function calculateToken2Deposit(uint256 _token1Amount)
        public
        view
        returns (uint256 token2Amount)
    {
        token2Amount = (token2Balance * _token1Amount) / token1Balance;
    }

    // Determine how many token1 tokens must be deposited when depositing liquidity for token2
    function calculateToken1Deposit(uint256 _token2Amount)
        public
        view
        returns (uint256 token1Amount)
    {
        token1Amount = (token1Balance * _token2Amount) / token2Balance;
    }

//                               Function to deposit token1 and receive token2
//                               ---------------------------------------------

    // Returns amount of token2 received when swapping token1
    // public ---> Can be called inside & outside the contract
    function calculateToken1Swap(uint256 _token1Amount)
        public
        view
        returns (uint256 token2Amount)
    {
        // Estimate the amount of token1 in the pool after the swap
        uint256 token1After = token1Balance + _token1Amount;

        // Calculate the amount of token2 that will be left in the pool
        uint256 token2After = K / token1After;

        // Calculate the amount of token2 user will be receive
        token2Amount = token2Balance - token2After;

        // Don't let the pool go to 0
        if (token2Amount == token2Balance) {
            token2Amount--;
        }
        require(token2Amount < token2Balance, "swap amount too large");
    }

//                                 Swaps token1 for token2
//                                 -----------------------

    // external ---> Called outside the contract
    // _token1Amount ---> Argument with amount of token1 to be swapped for token2
    // returns token2Amount ---> Returns the amount of token2 received
    function swapToken1(uint256 _token1Amount)
        external
        returns(uint256 token2Amount)
    {
        // Calculate Token 2 Amount
        // Using the calculateToken1Swap function to honor the amount shown in the UI
        token2Amount = calculateToken1Swap(_token1Amount);

//                                          Do Swap
//                              ------------------------------

        // Transfer token1 from the user to the contract
        // Use the transferFrom function from the Token contract with 3 arguments
        token1.transferFrom(msg.sender, address(this), _token1Amount);

        // Update the balance of token1 in the contract
        token1Balance += _token1Amount;

        // Subtract the amount of token2 from the pool
        // Update the balance of token2 in the contract
        token2Balance -= token2Amount;

        // Transfer token2 to the user
        // Use the transfer function from the Token contract with 2 arguments
        token2.transfer(msg.sender, token2Amount);

//                                      Emit an event
//                                      -------------
        
        emit Swap(
            msg.sender,
            address(token1),
            _token1Amount,
            address(token2),
            token2Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

//                            Function to deposit token 2 and receive token 1
//                            -----------------------------------------------

    // Returns amount of token1 received when swapping token2
    function calculateToken2Swap(uint256 _token2Amount)
        public
        view
        returns (uint256 token1Amount)
    {
        uint256 token2After = token2Balance + _token2Amount;
        uint256 token1After = K / token2After;
        token1Amount = token1Balance - token1After;

        // Don't let the pool go to 0
        if (token1Amount == token1Balance) {
            token1Amount--;
        }

        require(token1Amount < token1Balance, "swap amount too large");
    }

    // Swaps token2 for token1
    function swapToken2(uint256 _token2Amount)
        external
        returns(uint256 token1Amount)
    {
        // Calculate Token 1 Amount
        token1Amount = calculateToken2Swap(_token2Amount);

        // Do Swap
        token2.transferFrom(msg.sender, address(this), _token2Amount);
        token2Balance += _token2Amount;
        token1Balance -= token1Amount;
        token1.transfer(msg.sender, token1Amount);

        // Emit an event
        emit Swap(
            msg.sender,
            address(token2),
            _token2Amount,
            address(token1),
            token1Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

//                           Function to calculate the amount of tokens to be withdrawn
//                           ----------------------------------------------------------

    // Determine how many tokens will be withdrawn
    // Used to show the amount of tokens that will be withdrawn to user before the withdrawal
    function calculateWithdrawAmount(uint256 _share)
        public
        view
        returns (uint256 token1Amount, uint256 token2Amount)
    {
        require(_share <= totalShares, "must be less than total shares");
        token1Amount = (_share * token1Balance) / totalShares;
        token2Amount = (_share * token2Balance) / totalShares;
    }

//                                 Function to remove liquidity from the pool
//                                 ------------------------------------------

    // Removes liquidity from the pool
    function removeLiquidity(uint256 _share)
        external
        returns(uint256 token1Amount, uint256 token2Amount)
    {
        require(
            _share <= shares[msg.sender],
            "cannot withdraw more shares than you have"
        );

        (token1Amount, token2Amount) = calculateWithdrawAmount(_share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        token1Balance -= token1Amount;
        token2Balance -= token2Amount;
        K = token1Balance * token2Balance;

        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);

    // Emit an event
        // emit RemoveLiquidity(
        //     msg.sender,
        //     _share,
        //     token1Amount,
        //     token2Amount,
        //     token1Balance,
        //     token2Balance,
        //     block.timestamp
        // );
    }
}
