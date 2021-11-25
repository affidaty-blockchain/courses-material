#!/bin/env node
const t2lib = require('@affidaty/t2-lib');
const HashList = require('./include/hashlist').HashList;

// CONFIGS START
const nodeUrl = 'http://localhost:8000/';
const network = 'skynet';
// CONFIGS END

const c = new t2lib.Client(nodeUrl, network);
let hashList = new HashList();
let evenHash = hashList.load('iseven');
console.log(`EVEN HASH  : ${evenHash}`);
let mainHash = hashList.load('release');
console.log(`MAIN HASH  : ${mainHash}`);
let evenAcc = new t2lib.Account();
let mainAcc = new t2lib.Account();
let userAcc = new t2lib.Account();

async function init() {
    title('init');
    await evenAcc.generate();
    console.log(`EVEN : ${evenAcc.accountId}`);
    await mainAcc.generate();
    console.log(`MAIN : ${mainAcc.accountId}`);
    await userAcc.generate();
    console.log(`USER : ${userAcc.accountId}`);
};

async function isEven() {
    title('isEven');
    console.log(evenHash);
    let ticket = await c.prepareAndSubmitTx(
        evenAcc.accountId,
        evenHash,
        'iseven',
        {
            number: 2,
        },
        userAcc.keyPair.privateKey,
    );
    console.log(`TICKET : ${ticket}`);
    let receipt = await c.waitForTicket(ticket);
    console.log(`SUCCESS: ${receipt.success}`);
    if (receipt.success) {
        console.log(`RESULT : [${Buffer.from(receipt.result).toString('hex')}]`);
    } else {
        console.log(`ERROR : ${Buffer.from(receipt.result).toString()}`);
    }
};

async function initMain() {
    title('initMain');
    let ticket = await c.prepareAndSubmitTx(
        mainAcc.accountId,
        mainHash,
        'init',
        {
            isEvenAcc: evenAcc.accountId,
        },
        mainAcc.keyPair.privateKey,
    );
    console.log(`TICKET : ${ticket}`);
    let receipt = await c.waitForTicket(ticket);
    console.log(`SUCCESS: ${receipt.success}`);
    if (receipt.success) {
        console.log(`RESULT : [${Buffer.from(receipt.result).toString('hex')}]`);
        let accData = await c.accountData(mainAcc, ['*']);
        console.log(t2lib.Utils.bytesToObject(accData.requestedData[0]));
    } else {
        console.log(`ERROR : ${Buffer.from(receipt.result).toString()}`);
    }
}

async function saveNum() {
    title('saveNum');
    let ticket = await c.prepareAndSubmitTx(
        mainAcc.accountId,
        mainHash,
        'save_num',
        {
            key: 'my_key_1',
            number: 3,
        },
        mainAcc.keyPair.privateKey,
    );
    console.log(`TICKET : ${ticket}`);
    let receipt = await c.waitForTicket(ticket);
    console.log(`SUCCESS: ${receipt.success}`);
    if (receipt.success) {
        console.log(`RESULT : [${Buffer.from(receipt.result).toString('hex')}]`);
        let accData = await c.accountData(mainAcc, ['*']);
        console.log(t2lib.Utils.bytesToObject(accData.requestedData[0]));
    } else {
        console.log(`ERROR : ${Buffer.from(receipt.result).toString()}`);
    }
}

async function main() {
    await init();
    await isEven();
    await initMain();
    await saveNum();
}

main();

function title(str) {
    console.log(`===================|${str}|===================`);
};