import { Types, Utils, MemUtils, HostFunctions, MsgPack } from '../node_modules/@affidaty/trinci-sdk-as';

// exposing heap.alloc function for host to pass data
// to this module
export function alloc(size: i32): i32 {
    return heap.alloc(size) as i32;
}
// after loading module, host calls this function automatically
export function run(ctxAddress: i32, ctxSize: i32, argsAddress: i32, argsSize: i32): Types.TCombinedPtr {
    // decoding context and getting args from memory
    let ctxU8Arr: u8[] = MemUtils.u8ArrayFromMem(ctxAddress, ctxSize);
    let ctx = MsgPack.ctxDecode(ctxU8Arr);
    let argsU8: u8[] = MemUtils.u8ArrayFromMem(argsAddress, argsSize);
    let methodsMap = new Map<string, (ctx: Types.AppContext, args: u8[])=>Types.TCombinedPtr>();

    // REGISTER YOUR METHODS HERE
    // See definitions below
    methodsMap.set('init', init);
    methodsMap.set('save_num', saveNum);

    // ERROR IF METHOD NOT REGISTERED
    if (!methodsMap.has(ctx.method)) {
        let success = false;
        let resultBytes = Utils.stringtoU8Array('Method not found.');
        return MsgPack.appOutputEncode(success, resultBytes);
    }

    // CALL METHOD ASSOCIATED TO STRING
    return methodsMap.get(ctx.method)(ctx, argsU8);
}

@msgpackable
class InitArgs {
    isEvenAcc: string = '';
}

function init(ctx: Types.AppContext, argsU8: u8[]): Types.TCombinedPtr {
    if (ctx.owner != ctx.caller) {
        return MsgPack.appOutputEncode(false, Utils.stringtoU8Array('Permission denied'));
    }
    let args = MsgPack.deserialize<InitArgs>(argsU8);
    HostFunctions.storeData('isEvenAcc', Utils.stringtoU8Array(args.isEvenAcc));
    return MsgPack.appOutputEncode(true, [0x00]);
}


@msgpackable
class SaveNumArgs {
    key: string = '';
    number: i32 = 0;
}

@msgpackable
class IsEvenArgs {
    number: i32 = 0;
}

@msgpackable
class IsEvenReturn {
    result: bool = false;
}

function saveNum(ctx: Types.AppContext, argsU8: u8[]): Types.TCombinedPtr {
    if (ctx.owner != ctx.caller) {
        return MsgPack.appOutputEncode(false, Utils.stringtoU8Array('Permission denied'));
    }
    let isEvenAcc = Utils.u8ArrayToString(HostFunctions.loadData('isEvenAcc'));
    HostFunctions.log(isEvenAcc);
    if (isEvenAcc.length == 0) {
        return MsgPack.appOutputEncode(false, Utils.stringtoU8Array('Not initialized'));
    }
    HostFunctions.log('======================================');
    HostFunctions.log('saveNum() start');
    let args = MsgPack.deserialize<SaveNumArgs>(argsU8);
    HostFunctions.log(`key   : ${args.key}`);
    HostFunctions.log(`number: ${args.number}`);

    // calling isEven
    let evenArgs = new IsEvenArgs();
    evenArgs.number = args.number;
    let callReturn = HostFunctions.call(isEvenAcc, 'iseven', MsgPack.serialize(evenArgs));
    let isEvenReturn = MsgPack.deserialize<IsEvenReturn>(Utils.arrayBufferToU8Array(callReturn.result));
    if (!isEvenReturn.result) {
        return MsgPack.appOutputEncode(false, Utils.stringtoU8Array('Only even numbers'));
    };
    HostFunctions.storeData(args.key, [args.number as u8]);
    HostFunctions.log('saveNum() end');
    return MsgPack.appOutputEncode(true, [0x00]);
}
