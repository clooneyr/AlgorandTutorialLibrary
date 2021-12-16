const algosdk = require('algosdk');


//import * as approvalcontract from 'assets/approval_program.teal';
// user declared account mnemonics
creatorMnemonic = "brand globe reason guess allow wear roof leisure season coin own pen duck worth virus silk jazz pitch behave jazz leisure pave unveil absorb kick";
userMnemonic = "enforce drive foster uniform cradle tired win arrow wasp melt cattle chronic sport dinosaur announce shell correct shed amused dismiss mother jazz task above hospital";


// user declared algod connection parameters
algodAddress = "http://localhost:4001";
algodServer = "http://localhost";
algodPort = 4001;
algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

// declare application state storage (immutable)
localInts = 1;
localBytes = 1;
globalInts = 1;
globalBytes = 1;


// user declared approval program (refactored)
approvalProgramSourceRefactored = `#pragma version 5
txn ApplicationID
int 0
==
bnz main_l18
txn OnCompletion
int NoOp
==
bnz main_l11
txn OnCompletion
int OptIn
==
bnz main_l10
txn OnCompletion
int CloseOut
==
bnz main_l9
txn OnCompletion
int DeleteApplication
==
bnz main_l8
txn OnCompletion
int UpdateApplication
==
bnz main_l7
err
main_l7:
txn Sender
byte "owner"
app_global_get
==
return
main_l8:
txn Sender
byte "owner"
app_global_get
==
return
main_l9:
int 1
return
main_l10:
int 1
return
main_l11:
txna ApplicationArgs 0
byte "minus"
==
bnz main_l15
txna ApplicationArgs 0
byte "add"
==
bnz main_l14
err
main_l14:
byte "Counter"
app_global_get
store 0
byte "Counter"
load 0
int 1
+
app_global_put
int 1
return
main_l15:
byte "Counter"
app_global_get
store 0
load 0
int 0
>
bnz main_l17
main_l16:
int 1
return
main_l17:
byte "Counter"
load 0
int 1
-
app_global_put
b main_l16
main_l18:
byte "owner"
txn Sender
app_global_put
byte "Counter"
int 0
app_global_put
int 1
return 
`;

// declare clear state program source
clearProgramSource = `#pragma version 5
int 1
return
`;

// helper function to compile program source  
async function compileProgram(client, programSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledBytes;
}


// helper function to await transaction confirmation
// Function used to wait for a tx confirmation
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



// create new application
async function createApp(client, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes) {

    // define sender as creator
    sender = creatorAccount.addr;
    // declare onComplete as NoOp
    onComplete = algosdk.OnApplicationComplete.NoOpOC;

    // get node suggested parameters
    let params = await client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete,
        approvalProgram, clearProgram,
        localInts, localBytes, globalInts, globalBytes);
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();
    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['application-index'];
    console.log("Created new app-id: ", appId);
    return appId;
}

// optIn
async function optInApp(client, account, index) {
    // define sender
    sender = account.addr;
    // get node suggested parameters
    let params = await client.getTransactionParams().do();



    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationOptInTxn(sender, params, index);
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(account.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    console.log("Opted-in to app-id:", transactionResponse['txn']['txn']['apid'])
}

// call application 
async function callApp(client, account, index, appArgs) {
    // define sender
    sender = account.addr;

    // get node suggested parameters
    let params = await client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, index, appArgs)
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(account.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    console.log("Called app-id:", transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined) {
        console.log("Global State updated:", transactionResponse['global-state-delta']);
    }
    if (transactionResponse['local-state-delta'] !== undefined) {
        console.log("Local State updated:", transactionResponse['local-state-delta']);
    }
}

// read local state of application from user account
async function readLocalState(client, account, index) {
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

// read global state of application
async function readGlobalState(client, account, index) {
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

async function updateApp(client, creatorAccount, index, approvalProgram, clearProgram) {
    // define sender as creator
    sender = creatorAccount.addr;

    // get node suggested parameters
    let params = await client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationUpdateTxn(sender, params, index, approvalProgram, clearProgram);
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['txn']['txn'].apid;
    console.log("Updated app-id: ", appId);
    return appId;
}

// close out from application 
async function closeOutApp(client, account, index) {
    // define sender
    sender = account.addr;

    // get node suggested parameters
    let params = await client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationCloseOutTxn(sender, params, index)
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(account.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    console.log("Closed out from app-id:", transactionResponse['txn']['txn']['apid'])
}

async function deleteApp(client, creatorAccount, index) {
    // define sender as creator
    sender = creatorAccount.addr;

    // get node suggested parameters
    let params = await client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationDeleteTxn(sender, params, index);
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['txn']['txn'].apid;
    console.log("Deleted app-id: ", appId);
    return appId;
}

async function clearApp(client, account, index) {
    // define sender as creator
    sender = account.addr;

    // get node suggested parameters
    let params = await client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    // create unsigned transaction
    let txn = algosdk.makeApplicationClearStateTxn(sender, params, index);
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(account.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await waitForConfirmation(client, txId);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['txn']['txn'].apid;
    console.log("Cleared local state for app-id: ", appId);
    return appId;
}

async function main() {
    try {
        // initialize an algodClient
        let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        // get accounts from mnemonic
        let creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
        let userAccount = algosdk.mnemonicToSecretKey(userMnemonic);

        // compile programs 
        let approvalProgram = await compileProgram(algodClient, approvalProgramSourceRefactored);
        let clearProgram = await compileProgram(algodClient, clearProgramSource);

        // create new application
        let appId = await createApp(algodClient, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes);

        let appArgs = [];
        appArgs.push(new Uint8Array(Buffer.from('add'))); //Replace add with minus to subtract.. MUST ADD FIRST, cant have negative number

        await callApp(algodClient, userAccount, appId, appArgs);


        await readGlobalState(algodClient, userAccount, appID);

    }
    catch (err) {
        console.log("err", err);
    }
}

module.exports = { default: main };
