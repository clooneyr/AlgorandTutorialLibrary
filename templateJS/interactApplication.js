const algosdk = require('algosdk');
const { waitForConfirmation } = require('./createApplication');
/**
 * @description Lets user opt into application so local state can be changed
 * @async
 * @param {Object} client Client Constructor for connecting to test environment
 * @param {String} account Wallet SK obtained from mnemonic
 * @param {Number} index Number identifier for application
 */
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

/**
 * @description Calls application & passes arguements
 * @async
 * @param {Object} client Client Constructor for connecting to test environment
 * @param {String} account Wallet SK obtained from mnemonic
 * @param {Number} index Number identifier for application
 * @param {Uint8Array} appArgs Arguements passed which are put into a Uint8Array
 */
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

module.exports = { optInApp, callApp };