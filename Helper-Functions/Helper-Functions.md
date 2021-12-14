# Collection of helper functions for testing & building smart contracts

Following functions are for the Javascript SDK:

- [JavaScriptSDK](https://algorand.github.io/js-algorand-sdk/).


---

## Funding Account Script.

Copy and paste into Account.js file, run with algobuilder :

```
const {
    executeTransaction
  } = require('@algo-builder/algob');
  const { types } = require('@algo-builder/web');
  
  async function run (runtimeEnv, deployer) {
    const masterAccount = deployer.accountsByName.get('master-account');
    const creatorAccount = deployer.accountsByName.get('alice');
  
    const algoTxnParams = {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      toAccountAddr: creatorAccount.addr,
      amountMicroAlgos: 200e6,
      payFlags: {}
    };
    // transfer some algos to creator account
    await executeTransaction(deployer, algoTxnParams);
  
  }
  
  module.exports = { default: run };

```
---
