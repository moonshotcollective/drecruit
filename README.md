⚠️ **THIS REPOSITORY IS BEING ARCHIVED AND FUTURE DEVELOPMENT WORK WILL TAKE PLACE AT A [DIFFERENT REPOSITORY](https://github.com/moonshotcollective/recruiter.party)** ⚠️

----

# dRecruit

A decentralized recruiting platform built by the Moonshot Collective!

# Why we built this

Current recruiting sites like LinkedIn and Indeed often use candidates resumé data to build algrothims and sell information to recruiters. This is highly unethical, and candidates do not receive any compensation for the information they provide to recruiters. dRecruit offers a solution: Candidates get paid every time a recruiter accesses their data, and dRecruit does not use the information in unethical ways.

# 🏄‍♂️ Quick Start

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork 🏗 drecruit:
```bash
git clone https://github.com/moonshotcollective/drecruit.git
```

> install dependencies
```bash
cd drecruit
yarn install
```

> add .env in `packages/react-app`
1. **Copy-paste all .env.example files into a new file called `.env`.**
2. **Go to https://web3.storage and set the value of WEB3STORAGE_TOKEN with your web3.storage API key.**
```bash
cd packages/react-app
cp .env.example .env
```

> start your 👷‍ Hardhat chain:

```bash
cd drecruit
yarn ceramic
yarn chain
```

> in a second terminal window, 🛰 deploy your contract

```bash
cd drecruit
yarn deploy --network localhost --reset
```

> run the backend
1. Copy-paste all .env.example files into a new file called `.env`.
2. Copy the contract address of the deployed contract (you can find it in the terminal screen output from the last step) and paste it in the .env in packages/backend for the CONTRACT_ADDRESS variable.

```bash
cd packages/backend
cp .env.example .env
yarn dev
```

> in a third terminal window, start your 📱 frontend:

```bash
cd drecruit
yarn dev
```

🔏 Edit your smart contract `DRecruitV1.sol` in `packages/hardhat/contracts`

📝 Edit your frontend `index.js` in `packages/react-app/src/pages`

💼 Edit your deployment scripts in `packages/hardhat/deploy`

📱 Open http://localhost:3000 to see the app

# 📚 Documentation

Documentation, tutorials, challenges, and many more resources, visit: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)
