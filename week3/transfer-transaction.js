const algosdk = require('algosdk');


const waitForConfirmation = async function (algodClient, txId, timeout) {
    if (algodClient == null || txId == null || timeout < 0) {
        throw new Error("Bad arguments");
    }

    const status = (await algodClient.status().do());
    if (status === undefined) {
        throw new Error("Unable to get node status");
    }

    const startround = status["last-round"] + 1;
    let currentround = startround;

    while (currentround < (startround + timeout)) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo !== undefined) {
            if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                //Got the completed Transaction
                return pendingInfo;
            } else {
                if (pendingInfo["pool-error"] != null && pendingInfo["pool-error"].length > 0) {
                    // If there was a pool error, then the transaction has been rejected!
                    throw new Error("Transaction " + txId + " rejected - pool error: " + pendingInfo["pool-error"]);
                }
            }
        }
        await algodClient.statusAfterBlock(currentround).do();
        currentround++;
    }
    throw new Error("Transaction " + txId + " not confirmed after " + timeout + " rounds!");
};


async function deploymarketplace() {

    try {
        const senderSeed = "garage bright wisdom old fan mesh pull acquire clever pear era flight horror memory nerve ten hospital scorpion cricket erosion leader better hockey ability throw";



        // Connect your client
        const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        const algodServer = 'http://localhost';
        const algodPort = 4001;
        let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
        let params = await algodClient.getTransactionParams().do();

        let senderAccount = algosdk.mnemonicToSecretKey(senderSeed);

        let receiver = "ZCN7MOTRJNJHA6DS67SR742WKXWZM2J6GBVVEFOENKE33XE4ZMFM2PSOAQ"

        let sender = senderAccount.addr;

        let closeRemainderTo = undefined;
        let note = undefined;

        let txnPayment = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, 1, closeRemainderTo, note, params);

     	let signedTxn = txnPayment.signTxn(senderAccount.sk);
   
   
        // Submit the transaction
        let tx = (await algodClient.sendRawTransaction(signedTxn).do());

        // Wait for confirmation
        let confirmedTxn = await waitForConfirmation(algodClient, tx.txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
 
    }
    catch (err) {
        console.log("err", err);
    }
    process.exit();
};

deploymarketplace();

