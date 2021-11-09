### Picking issues

[ISSUES](https://github.com/moonshotcollective/drecruit/issues)

If you start working on an issue please assign it to yourself.

If you need help, please drop a message in `#project-drecruit` channel on Discord.

### Local dev environment setup

Clone the repo and follow these steps to get started with developing locally:

```bash
cd decruit

# Install dependencies
yarn install

# Copy the contents of .env.example to .env
cp packages/react-app/.env.example packages/react-app/.env
cp packages/backend/.env.example packages/backend/.env

# Generate a ceramic seed and copy it to the react app's .env
yarn ceramic

# Copy the contract's address to the backend's .env (the contract is deployed on the Mumbai testnet)
CONTRACT_ADDRESS=0x9486cB9438b3279D70c55681B41bf50b5c537Aa4

# (OPTIONAL) If you want to develop on the localhost network, do this:
yarn chain
yarn deploy --network localhost --reset
CONTRACT_ADDRESS=<deployed_contract_address> (in the backend .env)

# In the backend .env, set the following variables:
RPC_URL=https://rpc-mumbai.maticvigil.com/ (or you can get one from infura)
DB_URL=<any mongodb url> (you can run mongodb locally or get a free DB from MongoDB atlas)

# Grab a free token from https://web3.storage and set it in the React app .env
WEB3STORAGE_TOKEN=<your token>

# Start the backend
cd packages/backend
yarn install
yarn dev

# Start the React app (make sure you're at the root of the repo)
yarn dev
```

### Redeploying the contracts on Mumbai

```bash
yarn deploy --network mumbai
```

and if you want to clear the state of the contract

```bash
yarn deploy --network mumbai --reset
```

Verify the contract

```bash
npx hardhat verify --network mumbai [CONTRACT_ADDRESS]
```

After each deployment, and depending on your network, you might need to modify the environment variables in the
backend.
