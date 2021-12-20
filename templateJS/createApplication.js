const algosdk = require('algosdk');
/**
 * @description Function waits for transaction to complete
 * @param {Object} algodclient Constructor for connecting to test environment
 * @param {String} txId Identification key for the current transaction
 */
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

/**
 * 
 * @description Creates application and puts it on Algorand
 * @async
 * @param {Object} client Constructor for connecting to test environment
 * @param {String} creatorAccount Wallet SK obtained from mnemonic
 * @param {String} approvalProgram TEAL source code for approval program
 * @param {String} clearProgram TEAL source code for clear program
 * @param {Number} localInts Local state allocation
 * @param {Number} localBytes Local state allocation
 * @param {Number} globalInts Global state allocation
 * @param {Number} globalBytes Global state allocation
 * @returns {Number} Application ID
 */
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

module.exports = { waitForConfirmation, createApp };