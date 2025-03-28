# Saucy Sam Automated Market Maker (AMM)

Welcome to the Saucy Sam AMM project! This repository contains a decentralized Automated Market Maker (AMM) application built with Solidity, Hardhat, and React. The project demonstrates the deployment and interaction with a smart contract on the Ethereum blockchain, enabling token swaps, liquidity provision, and charting of historical data.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Deployment](#deployment)
- [Testing](#testing)
- [Scripts](#scripts)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Introduction

This project showcases a full-stack blockchain application, including a smart contract for an AMM and a React frontend for interacting with the contract. The AMM supports token swaps, liquidity management, and historical data visualization.

## Features

- **Automated Market Maker**: Swap tokens using a constant product formula.
- **Liquidity Management**: Add and remove liquidity to earn LP shares.
- **Historical Data Visualization**: View swap history and exchange rates using charts.
- **Frontend Integration**: A React application to interact with the deployed smart contract.
- **Testing**: Comprehensive unit tests for the smart contract.

## Project Structure

. ├── .gitignore ├── artifacts/ ├── cache/ ├── contracts/ │ ├── AMM.sol │ └── Token.sol ├── hardhat.config.js ├── package.json ├── public/ │ ├── index.html │ └── manifest.json ├── scripts/ │ ├── deploy.js │ └── seed.js ├── src/ │ ├── abis/ │ │ ├── AMM.json │ │ └── Token.json │ ├── components/ │ │ ├── App.js │ │ ├── Swap.js │ │ ├── Deposit.js │ │ ├── Withdraw.js │ │ └── Charts.js │ ├── store/ │ │ ├── reducers/ │ │ └── interactions.js │ ├── index.css │ ├── index.js │ └── reportWebVitals.js ├── test/ │ ├── AMM.js │ └── Token.js └── README.md


## Setup Instructions

1. **Clone the repository**: git clone https://github.com/your-username/saucy-sam-amm.git


2. **Install dependencies**: npm install


3. **Set up environment variables**:
Create a `.env` file in the root directory and add the following: ALCHEMY_API_KEY=your-alchemy-api-key PRIVATE_KEYS=your-private-keys


## Deployment

1. **Compile the contracts**: npx hardhat compile


2. **Deploy the contracts**: npx hardhat run deploy.js --network localhost


3. **Seed the contracts with initial data**: npx hardhat run seed.js --network localhost


## Testing

1. **Run the tests**: npx hardhat test


## Scripts

- **Start the React app**: npm run start


- **Build the React app**: npm run build


- **Run tests**: npm test


## Technologies Used

- **Solidity**: Smart contract programming language.
- **Hardhat**: Ethereum development environment.
- **React**: JavaScript library for building user interfaces.
- **Redux**: State management for the frontend.
- **Ethers.js**: Library for interacting with the Ethereum blockchain.
- **Chai**: Assertion library for testing.

## Contributing

Contributions to this project are welcome. Please fork the repository and submit pull requests for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.