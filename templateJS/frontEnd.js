const algosdk = require('algosdk');
const compileProgram = require('./compileProgram');
const tealSource = require('./approvalTeal');
const clearSource = require('./clearTeal');
const { waitForConfirmation } = require('./createApplication');
const { createApp } = require('./createApplication');
const { optInApp } = require('./interactApplication');
const { callApp } = require('./interactApplication');
const { readGlobalState } = require('./readingState');
const { readLocalState } = require('./readingState');
const { updateApp } = require('./contractManagement');
const { closeOutApp } = require('./contractManagement');
const { deleteApp } = require('./contractManagement');
const { clearApp } = require('./contractManagement');
//import createApp from './creatApplication';
//import compileProgram from './compileProgram';
//import tealSource from './contractTeal';


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
globalBytes = 0;


async function main() {
    try {
        // initialize an algodClient
        let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        // get accounts from mnemonic
        let creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
        let userAccount = algosdk.mnemonicToSecretKey(userMnemonic);

        // compile programs 
        let approvalProgram = await compileProgram(algodClient, tealSource);
        let clearProgram = await compileProgram(algodClient, clearSource);

        // create new application
        let appId = await createApp(algodClient, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes);

        // opt-in to application
        await optInApp(algodClient, userAccount, appId);

        // call application with arguments
        let ts = new Date(new Date().toUTCString());
        console.log(ts);
        let appArgs = [];
        appArgs.push(new Uint8Array(Buffer.from(ts)));

        await callApp(algodClient, userAccount, appId, appArgs);

        // read local state of application from user account
        await readLocalState(algodClient, userAccount, appId);

        // close-out from application
        await closeOutApp(algodClient, userAccount, appId);

        // opt-in again to application
        await optInApp(algodClient, userAccount, appId);

        // call application with arguments
        await callApp(algodClient, userAccount, appId, appArgs);

        // read local state of application from user account
        await readLocalState(algodClient, userAccount, appId);

        // clear application from user account
        await clearApp(algodClient, userAccount, appId);

    }
    catch (err) {
        console.log("err", err);
    }
}

module.exports = { default: main };
