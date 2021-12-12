# Quick Start To Deploy & Interact With Smart Contracts on Algorand

This process can be simplified AlgoBuilder, however this method is recommended if you are struggling to wrap your head around the concept:

- [AlgoBuilder](https://github.com/scale-it/algo-builder).

---

### _Environment Setup:_

- Please refer to the [Environment Setup](envSetup.md) documentation for details.

---

## Initialise deployment script.

import the JS SDK:

```
const algosdk = require('algosdk');
```

Declare algod connection parameters, these will vary depending on your development environment setup, the following are defaults for a PrivateNode & Sandbox :

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
For best practice save the following functions in separate JS files and important them for use.

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

---

## Deployment Function.

To get a better grasp of this function I have broken it into 4 stages.

First we are declaring who the sender is, we do this by passing the creatorAccount object and then utilising .addr to obtain the address.

We are also using [OnApplicationComplete.NoOpOC](https://algorand.github.io/js-algorand-sdk/enums/onapplicationcomplete.html) which simply calls the approval program on the completion of the transaction:

```

async function createApp(client, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes) {

    sender = creatorAccount.addr;
    onComplete = algosdk.OnApplicationComplete.NoOpOC;

```

Now we need to get the common needed parameters for a new transaction:

```

let params = await client.getTransactionParams().do();

```

Now we are ready to create a transaction, for this transaction we are using [makeApplicationCreateTxn](https://algorand.github.io/js-algorand-sdk/modules.html#makeapplicationcreatetxn) which is used to create the application, for this function to be called me must include the compulsory 9 parameters which are the following:

- From: address of sender
- suggestedParams: parameters that are necessary for creating a new transaction, for simplicity in testing just use client.getTransactionParams()
- onComplete: what the application should do once the transaction has been completed
- approvalProgram: Source code of approval program
- clearProgram: Source code of clear program
- numLocalInts: Restricts number of ints in per-user local state
- numLocalByteSlices: Restricts number of byte slices in per-user local state
- numGlobalInts: Restricts number of ints in global state
- numGlobalByteSlices: Restricts number of byte slices in global state
- For the additional optional parameters refer to SDK documentation

```
let txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete,
                                            approvalProgram, clearProgram,
                                            localInts, localBytes, globalInts, globalBytes,);
    let txId = txn.txID().toString();

```

For a transaction to be sent, it first must be signed, we do this by using the creator accounts secret key:

```
let signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

```

Now that we have a signed transaction we are able to submit it to our development environment, we also utilise the waitForConfirmation function mentioned above to ensure the transaction has worked error free:

```
await client.sendRawTransaction(signedTxn).do();
await waitForConfirmation(client, txId);

```

display the results:

```
let transactionResponse = await client.pendingTransactionInformation(txId).do();
let appId = transactionResponse['application-index'];
console.log("Created new app-id: ",appId);
return appId;

```

## Opting In Function.

In order to interact with a smart contract (application) we fist must opt into it

First we need to declare the sender of the transaction, and get the necessary paramerters to create a new transaction:

```
async function optInApp(client, account, index) {
    sender = account.addr;
    let params = await client.getTransactionParams().do();

```

Now we create the transaction, for this transaction we are using [makeApplicationOptInTxn](https://algorand.github.io/js-algorand-sdk/modules.html#makeapplicationoptintxn) which is specifying that this transaction is opting into the application to use it:

```
let txn = algosdk.makeApplicationOptInTxn(sender, params, index);
let txId = txn.txID().toString();

```

In every instance of creating a transaction we have to repeat the same steps of signing it & waiting for confirmation:

```
let signedTxn = txn.signTxn(account.sk);
console.log("Signed transaction with txID: %s", txId);

await client.sendRawTransaction(signedTxn).do();

await waitForConfirmation(client, txId);

```

display results:

```
let transactionResponse = await client.pendingTransactionInformation(txId).do();
console.log("Opted-in to app-id:",transactionResponse['txn']['txn']['apid'])

```

## Calling App Function.

In this function we are calling the application to interact with it, in order to trigger specific logic from a contract we need to pass arguments:

First we repeat the same steps of setting up the transaction like so:

```
async function callApp(client, account, index, appArgs) {
    sender = account.addr;
    let params = await client.getTransactionParams().do();

```

Now we create the transaction, for this transaction we are using [makeApplicationNoOpTxn](https://algorand.github.io/js-algorand-sdk/modules.html#makeapplicationnooptxn), makeApplication is just simply a call to the application, the parts after this represents the side affects of the call, in this instance all we want to do is call the application so we use NoOpTxn:

```
let txn = algosdk.makeApplicationNoOpTxn(sender, params, index, appArgs)
let txId = txn.txID().toString();

```

Now repeat the same steps of signing it & waitng for confirmation:

```
let signedTxn = txn.signTxn(account.sk);
console.log("Signed transaction with txID: %s", txId);

await client.sendRawTransaction(signedTxn).do();

await waitForConfirmation(client, txId);

```

Display results:

```
let transactionResponse = await client.pendingTransactionInformation(txId).do();
console.log("Called app-id:",transactionResponse['txn']['txn']['apid'])
if (transactionResponse['global-state-delta'] !== undefined ) {
    console.log("Global State updated:",transactionResponse['global-state-delta']);
}
if (transactionResponse['local-state-delta'] !== undefined ) {
    console.log("Local State updated:",transactionResponse['local-state-delta']);
}

```

## Read Local & Global states

Generic functions & can be used with every deployment / interaction script:

readLocalState

```
async function readLocalState(client, account, index){
    let accountInfoResponse = await client.accountInformation(account.addr).do();
    for (let i = 0; i < accountInfoResponse['apps-local-state'].length; i++) {
        if (accountInfoResponse['apps-local-state'][i].id == index) {
            console.log("User's local state:");
            for (let n = 0; n < accountInfoResponse['apps-local-state'][i][`key-value`].length; n++) {
                console.log(accountInfoResponse['apps-local-state'][i][`key-value`][n]);
            }
        }
    }
}

```

readGlobalState

```
async function readGlobalState(client, account, index){
    let accountInfoResponse = await client.accountInformation(account.addr).do();
    for (let i = 0; i < accountInfoResponse['created-apps'].length; i++) {
        if (accountInfoResponse['created-apps'][i].id == index) {
            console.log("Application's global state:");
            for (let n = 0; n < accountInfoResponse['created-apps'][i]['params']['global-state'].length; n++) {
                console.log(accountInfoResponse['created-apps'][i]['params']['global-state'][n]);
            }
        }
    }
}

```

## Main Function

In this function we will be calling all of the functions we have declared above allowing us to interact with the testnet of your choice:

First we configure the algodClient with connection parameters we provided at the start:

```
let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

```

Follow this tutorial to learn how to fund accounts (insert here)
Then we need to important two accounts that have been funded:

```
creatorMnemonic = "Mnemonic Here";
userMnemonic = "Mnemonic Here";

let creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
let userAccount = algosdk.mnemonicToSecretKey(userMnemonic);

```

Now we compile our approbal / clear contracts:

```
let approvalProgram = await compileProgram(algodClient, approvalProgramSourceRefactored);
let clearProgram = await compileProgram(algodClient, clearProgramSource);

```

We are now ready to call the creatApp function to deploy our contracts:

```
let appId = await createApp(algodClient, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes);

```

Next we opt into the application to interact with it:

```
await optInApp(algodClient, userAccount, appId);

```

Now we can call our smart contract:

- if we wanted to pass an argument we would replace undefined with appArgs

```
await callApp(algodClient, userAccount, appId, undefined);

```

Read the local state:

```
await readLocalState(algodClient, userAccount, appId);

```

Finally export the main function:

```
module.exports = { default: main };

```

If you are using algobuilders deployment environment use the following:

```
yarn run algob deploy scripts/<File name>

```
