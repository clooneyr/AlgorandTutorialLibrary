# Build a counter application with React and Algorand using PyTeal and the JavaScript SDK

This tutorial will demonstrate how we will how to build a simple counter application using react, pyteal and the JavaScript SDK. This dApp will allow us to increment, decrem,ent and query the value of the counter. Firstly we weant to make sure that the following are done

- We have the enviroment set up which includes the sandbox, follow [Setup a development environment using Algorand sandbox](https://github.com/clooneyr/AlgorandTutorialLibrary/blob/main/envSetup.md) to set up a sandbox
- Next we want to have two accounts created you can use the JavaScript code to generate the accounts in [Week 3](https://github.com/clooneyr/AlgorandTutorialLibrary/tree/main/week3) however i have also provided the code in the files.
- Now we can start creating with the counter application!!!

## Lets get started!

Firstly we need to start the enviroment so execute the command

```
./sandbox up testnet
```

Then we want to have our two accounts created in the ./client/App.js file we can see my two mnemonics in the code, make sure to replace yours with mine!

## Counter Contract 📚

Now we need to create the smart contracts, we can do this by running the following code, also in the ./contacts/counter.py file, make sure you have an enviroment installed and that you have

```
pip install pyteal
```

```
from pyteal import *

""" Counter program """

def approval_program():
    on_create = Seq([
        App.globalPut(Bytes("owner"), Txn.sender()),
        App.globalPut(Bytes("Counter"), Int(0)),
        Approve(),
    ])


    is_owner = Txn.sender() == App.globalGet(Bytes("owner"))

    #Declaring scratchspace, with type uint64
    scratchCount = ScratchVar(TealType.uint64)


    #Setting Function that allows user to change count value to any number
    SetNumber = Btoi(Txn.application_args[1])
    numberSet = Seq([
        #scratchCount.store(App.globalGet(Bytes("Counter"))), #putting the current value of counter in scratch space
        App.globalPut(Bytes("Counter"), SetNumber), #then we are changing the value of counter by adding 1
        Approve(),
    ])

    #Addition Function which adds 1
    addition = Seq([
        scratchCount.store(App.globalGet(Bytes("Counter"))), #putting the current value of counter in scratch space
        App.globalPut(Bytes("Counter"), scratchCount.load() + Int(1)), #then we are changing the value of counter by adding 1
        Approve(),
    ])

    #Subtraction Function which minuses 1
    subtraction = Seq([
        scratchCount.store(App.globalGet(Bytes("Counter"))), #putting the current value of counter in scratch space
        If(scratchCount.load() > Int(0),
            App.globalPut(Bytes("Counter"), scratchCount.load() - Int(1)), #then we are changing the value of counter by subtracting  1
        ),
        Approve(),
   ])

    on_call_method = Txn.application_args[0]
    on_call = Cond(
        [on_call_method == Bytes("minus"), subtraction],
        [on_call_method == Bytes("add"), addition],
        [on_call_method == Bytes("set"), numberSet],

    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_owner)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_owner)],
    )

    return program


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)
```

## Create the Contracts by running

```
  python3 counter.py
```

Once you have executes and compile the code this will create 2 files with the .teal extension, "apporval" and "clear". These are our smart Contracts. We are going to be using these contracts soon, when we create our application

## Counter Program

First in the client file execute the command:

```
npm install
```

This will ensure that all our dependencies are installed.

Next we want to navigate to our client folder inside ./client/src, we will have a contracts folder, copy and paste the code in the corresponsing smart contract replace mine!

Next navigate to the App.js file it should look something like this, however it will have you mneomics instead of the ones that was originally there.

```
import React, { useState } from "react";
import { Buffer } from "buffer";
import algosdk from "algosdk";
import approval from "./contracts/approval";
import clear from "./contracts/clear";

const creatorMnemonic =
	"spell cry quit border inflict drastic worry butter hip obey since coffee stage speak alcohol excess six blur ticket stand party fury kite above choose";
const userMnemonic =
	"wall outdoor there pipe senior exotic reunion memory federal trouble dinner dwarf any shoot finish universe deputy citizen ski dragon direct wait steak above dial";

// user declared algod connection parameters
const algodAddress = "http://localhost:4001";
const algodServer = "http://localhost";
const algodPort = 4001;
const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

// declare application state storage (immutable)
const localInts = 1;
const localBytes = 1;
const globalInts = 1;
const globalBytes = 1;

// user declared approval program (refactored)
let approvalProgramSourceRefactored = approval;

// declare clear state program source
let clearProgramSource = clear;

let algodClient;
let creatorAccount;
let userAccount;
let approvalProgram;
let clearProgram;
let appId;
let appInc = [];
let appDec = [];

function App() {
	const [counter, setCounter] = useState([0]);

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
		let status = await algodclient.status().do();
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
		let sender = creatorAccount.addr;
		// declare onComplete as NoOp
		let onComplete = algosdk.OnApplicationComplete.NoOpOC;

		// get node suggested parameters
		let params = await client.getTransactionParams().do();
		// comment out the next two lines to use suggested fee
		params.fee = 1000;
		params.flatFee = true;

		// create unsigned transaction
		let txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes);
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
		let appId = transactionResponse["application-index"];
		console.log("Created new app-id: ", appId);
		return appId;
	}

	// call application
	async function callApp(client, account, index, appArgs) {
		// define sender
		let sender = account.addr;

		// get node suggested parameters
		let params = await client.getTransactionParams().do();
		// comment out the next two lines to use suggested fee
		params.fee = 1000;
		params.flatFee = true;

		// create unsigned transaction
		let txn = algosdk.makeApplicationNoOpTxn(sender, params, index, appArgs);
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
		console.log("Called app-id:", transactionResponse["txn"]["txn"]["apid"]);
		if (transactionResponse["global-state-delta"] !== undefined) {
			console.log("Global State updated:", transactionResponse["global-state-delta"]);
			setCounter(transactionResponse["global-state-delta"]);
		}
		if (transactionResponse["local-state-delta"] !== undefined) {
			console.log("Local State updated:", transactionResponse["local-state-delta"]);
		}
	}

	// read global state of application
	async function readGlobalState(client, account, index) {
		let accountInfoResponse = await client.accountInformation(account.addr).do();
		for (let i = 0; i < accountInfoResponse["created-apps"].length; i++) {
			if (accountInfoResponse["created-apps"][i].id === index) {
				console.log("Application's global state:");
				for (let n = 0; n < accountInfoResponse["created-apps"][i]["params"]["global-state"].length; n++) {
					console.log(accountInfoResponse["created-apps"][i]["params"]["global-state"][n]);
				}
			}
		}
	}

	async function deleteApp(client, creatorAccount, index) {
		// define sender as creator
		let sender = creatorAccount.addr;

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
		let appId = transactionResponse["txn"]["txn"].apid;
		console.log("Deleted app-id: ", appId);
		return appId;
	}

	async function createApplication() {
		try {
			// initialize an algodClient
			algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

			// get accounts from mnemonic
			creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
			userAccount = algosdk.mnemonicToSecretKey(userMnemonic);

			// compile programs
			approvalProgram = await compileProgram(algodClient, approvalProgramSourceRefactored);
			clearProgram = await compileProgram(algodClient, clearProgramSource);

			// create new application
			appId = await createApp(algodClient, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes);
		} catch (err) {
			console.log("err", err);
		}
	}

	async function increment() {
		appInc.push(new Uint8Array(Buffer.from("add"))); //Replace add with minus to subtract.. MUST ADD FIRST, cant have negative number
		await callApp(algodClient, userAccount, appId, appInc);
		await readGlobalState(algodClient, userAccount, appId);
	}

	async function decrement() {
		appDec.push(new Uint8Array(Buffer.from("minus"))); //Replace add with minus to subtract.. MUST ADD FIRST, cant have negative number
		await callApp(algodClient, userAccount, appId, appDec);
		await readGlobalState(algodClient, userAccount, appId);
	}

	async function endApplication() {
		await deleteApp(algodClient, creatorAccount, appId);
		setCounter([0]);
	}

	function getCount() {
		alert("The current count is" + JSON.stringify(counter));
	}

	return (
		<div className="App">
			<div className="container">
				<h1>Algorand Counter Application</h1>
				<div className="text">{counter.map((count, index) => JSON.stringify(count.value))}</div>
				<button className="btn" onClick={() => createApplication()}>
					Create Application
				</button>
				<button className="btn" onClick={() => decrement()}>
					Decrement
				</button>
				<button className="btn" onClick={() => getCount()}>
					{" "}
					Count
				</button>
				<button className="btn" onClick={() => increment()}>
					Increment
				</button>
				<button className="btn" onClick={() => endApplication()}>
					End Application
				</button>
			</div>
		</div>
	);
}

export default App;
```

Basically what this is generate 5 buttons and a counter, these buttons will create the application, get the current value, increment / decrement the count and also end the application. We can see that our global variables are defined.

If an error has occured related to "Cant Resolve "Crypto in node_module"
Follow the link [here](https://www.mongodb.com/community/forums/t/cant-resolve-crypto-in-node-modules-bson-dist-react/143227)
