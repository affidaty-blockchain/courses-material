#!/bin/env node

const fs = require('fs');
const t2lib = require('@affidaty/t2-lib');
const fileFromPath = require('./include/hashlist').fileFromPath;
const HashList = require('./include/hashlist').HashList;
const { argv } = require('process');
const hashList = new HashList();

// CONFIGS START
// const nodeUrl = 'http://t2.dev.trinci.net/0.2.3rc1/';
const nodeUrl = 'http://localhost:8000';
// const network = 'breakingnet';
const network = 'skynet';

// List of files to publish. You can also pass a list of paths
// as args. they will be added to this list
const fileList = [
    '../build/iseven.wasm',
    '../build/release.wasm',
]
// CONFIGS END

// appending passed paths to fileList array
if (argv.length > 2) {
    for (let i = 2; i < argv.length; i++) {
        fileList.push(argv[i]);
    }
}

const scriptDir = argv[1].substring(0, argv[1].lastIndexOf('/'));

let c = new t2lib.Client(nodeUrl, network);
const publisher = new t2lib.Account();

async function main() {
    await publisher.generate();
    console.log(`PUBLISHER: ${publisher.accountId}`);
    for (let fileIdx = 0; fileIdx < fileList.length; fileIdx++) {
        if (fileList[fileIdx][0] !== '/') {
            fileList[fileIdx] = `${scriptDir}/${fileList[fileIdx]}`;
        }
        const scVersion = `${(new Date().toUTCString()).replace(/ /g, '_')}`;
        const scName = `${fileFromPath(fileList[fileIdx], true)}-${scVersion}`;
        const scDescription = `${fileFromPath(fileList[fileIdx], true)} smart contract`;
        const scUrl = 'https://affidaty.io/';
        let scBin = new Uint8Array(fs.readFileSync(fileList[fileIdx]));
        let tx = new t2lib.stdTxPrepareUnsigned.service.contract_registration(
            c.serviceAccount,
            network,
            {
                name: scName,
                description: scDescription,
                version: scVersion,
                url: scUrl,
                bin: scBin,
            }
        );
        let ticket = await c.signAndSubmitTx(tx, publisher.keyPair.privateKey);
        let receipt = await c.waitForTicket(ticket);
        let hashString;
        if (receipt.success) {
            hashString = t2lib.Utils.bytesToObject(receipt.result);
            hashList.save(fileFromPath(fileList[fileIdx], true), hashString);
        } else {
            hashString = Buffer.from(receipt.result).toString();
        }
        console.log(`${fileFromPath(fileList[fileIdx], true)}: ${hashString}`);
    }
}

main();
