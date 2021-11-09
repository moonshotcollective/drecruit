### Picking issues

[ISSUES](https://github.com/moonshotcollective/drecruit/issues)

If you start working on an issue please assign it to yourself.

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
