# dRecruit

A decentralized recruiting platform built by the Moonshot Collective!

# Why we built this

Current recruiting sites like LinkedIn and Indeed often use candidates resumé data to build algrothims and sell information to recruiters. This is highly unethical, and candidates do not receive any compensation for the information they provide to recruiters. dRecruit offers a solution: Candidates get paid every time a recruiter accesses their data, and dRecruit does not use the information in unethical ways.

# 🏄‍♂️ Quick Start

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

```bash
  cd packages/react-app
```

**Copy-paste all .env.example files into a new file called `.env`.**

> clone/fork 🏗 drecruit:

```bash
  https://github.com/moonshotcollective/drecruit.git
```

> install and start your 👷‍ Hardhat chain:

```bash
cd drecruit
yarn install
yarn ceramic
yarn chain
```

> in a second terminal window, 🛰 deploy your contract, install and run the backend:

```bash
cd drecruit
yarn deploy
cd packages/backend
yarn install
yarn global add nodemon
yarn dev
```

> in a third terminal window, start your 📱 frontend:

```bash
cd drecruit
yarn dev
```

🔏 Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`

📝 Edit your frontend `index.js` in `packages/react-app/src/pages`

💼 Edit your deployment scripts in `packages/hardhat/deploy`

📱 Open http://localhost:3000 to see the app

# 📚 Documentation

Documentation, tutorials, challenges, and many more resources, visit: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)
