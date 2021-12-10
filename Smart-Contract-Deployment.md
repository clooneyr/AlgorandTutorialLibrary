# Quick Start To Deploy & Interact With Smart Contracts on Algorand

This process can be simplified AlgoBuilder, however this method is recommended if you are struggling to wrap your head around the concept:

- [AlgoBuilder](https://github.com/scale-it/algo-builder).


---

### _Prerequisites:_

- Development Environment Setup, you can use following documentation "insert here".

---

## Initialise deployment script.

import the JS SDK:

```
const algosdk = require('algosdk');
```

Declare algod connection parameters, these will vary depending on your development environment setup, the following are defaults for a PrivateNode & Sanbox :

```
algodAddress = "http://localhost:4001";
algodServer = "http://localhost";
algodPort = 4001;
algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

```
Declare state storage variables, once deployed these values cannot be changed :

```
localInts = 1;
localBytes = 1;
globalInts = 1;
globalBytes = 0;

```

---

## Setting up deployment functions.

The following two functions are generic and can be used when deploying any smart contract.
For best practice save the following functions in seperate JS files and important then for use.

Compiler Function:
```
async function compileProgram(client, programSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledBytes;
}

```
Confirmation Function:

```

const waitForConfirmation = async function (algodclient, txId) {
    let status = (await algodclient.status().do());
    let lastRound = status["last-round"];
      while (true) {
        const pendingInfo = await algodclient.pendingTransactionInformation(txId).do();
        if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
          //Got the completed Transaction
          console.log("Transaction " + txId + " confirmed in round " + pendingInfo["confirmed-round"]);
          break;
        }
        lastRound++;
        await algodclient.statusAfterBlock(lastRound).do();
      }
    };

```