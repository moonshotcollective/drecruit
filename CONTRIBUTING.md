### Picking issues

[ISSUES](https://github.com/moonshotcollective/drecruit/issues)

If you start working on an issue please assign it to yourself.

### Publishing new Ceramic schemas

Edit the data model in packages/react-app/schemas and then run the following command to generate a new model.json with the updated definitions

```bash
yarn ceramic
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
