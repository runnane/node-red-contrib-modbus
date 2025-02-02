"use strict";
require("source-map-support").install();
var de = de || {
    biancoroyal: {
        modbus: {
            queue: {
                core: {}
            }
        }
    }
};
de.biancoroyal.modbus.queue.core.internalDebug = de.biancoroyal.modbus.queue.core.internalDebug || require("debug")("contribModbus:queue:core"), de.biancoroyal.modbus.queue.core.core = de.biancoroyal.modbus.queue.core.core || require("./modbus-core"), de.biancoroyal.modbus.queue.core.initQueue = function (e) {
    e.bufferCommandList.clear(), e.sendingAllowed.clear(), e.unitSendingAllowed = [];
    for (var n = 0; n <= 255; n++) e.bufferCommandList.set(n, []), e.sendingAllowed.set(n, !0)
}, de.biancoroyal.modbus.queue.core.checkQueuesAreEmpty = function (e) {
    for (var n = !0, o = 0; o <= 255; o++) n &= 0 === e.bufferCommandList.get(o).length;
    return n
}, de.biancoroyal.modbus.queue.core.queueSerialUnlockCommand = function (e) {
    this.internalDebug("queue serial unlock command node " + e.name), e.serialSendingAllowed = !0
}, de.biancoroyal.modbus.queue.core.queueSerialLockCommand = function (e) {
    this.internalDebug("queue serial lock command node " + e.name), e.serialSendingAllowed = !1
}, de.biancoroyal.modbus.queue.core.sequentialDequeueCommand = function (i) {
    return this.internalDebug("sequential de-queue command"), new Promise(function (e, n) {
        var o = de.biancoroyal.modbus.queue.core;
        if (i.parallelUnitIdsAllowed)
            for (var u = 0; u < 256; u += 1) o.sendQueueDataToModbus(i, u);
        else {
            var d = i.unitSendingAllowed.shift();
            if (!d) return void n(new Error("UnitId is valid from sending allowed list"));
            i.queueLog(JSON.stringify({
                type: "sequential dequeue command",
                unitId: d,
                isValidUnitId: o.isValidUnitId(d),
                sendingAllowed: i.sendingAllowed.get(d),
                serialSendingAllowed: i.serialSendingAllowed
            })), o.isValidUnitId(d) && i.sendingAllowed.get(d) ? o.sendQueueDataToModbus(i, d) : (i.warn("sequential dequeue command not possible for Unit " + d), n = "sending is allowed for Unit ", i.sendingAllowed.get(d) ? i.warn(n + d) : i.warn("no " + n + d), n = "valid  Unit ", o.isValidUnitId(d) ? i.warn(n + d) : i.warn("no " + n + d), n = " serial sending allowed for Unit ", i.serialSendingAllowed ? i.warn(i.name + n + d) : i.warn(i.name + " no" + n + d))
        }
        e()
    })
}, de.biancoroyal.modbus.queue.core.sendQueueDataToModbus = function (e, n) {
    var o = e.bufferCommandList.get(n).length;
    if (e.queueLog(JSON.stringify({
            type: "send queue data to Modbus",
            unitId: n,
            queueLength: o,
            sendingAllowed: e.sendingAllowed.get(n),
            serialSendingAllowed: e.serialSendingAllowed
        })), o) {
        o = e.bufferCommandList.get(n).shift();
        if (!o) throw new Error("Command On Send Not Valid");
        e.sendingAllowed.set(n, !1), o.callModbus(e, o.msg, o.cb, o.cberr)
    }
}, de.biancoroyal.modbus.queue.core.dequeueLogEntry = function (e, n, o) {
    e.queueLog(JSON.stringify({
        state: n.value,
        message: "".concat(o, " ").concat(e.clienttype),
        delay: e.commandDelay
    }))
}, de.biancoroyal.modbus.queue.core.dequeueCommand = function (n) {
    var o = de.biancoroyal.modbus.queue.core,
        u = n.actualServiceState; - 1 === n.messageAllowedStates.indexOf(u.value) ? o.dequeueLogEntry(n, u, "dequeue command disallowed state") : o.sequentialDequeueCommand(n).then(function () {
        o.dequeueLogEntry(n, u, "dequeue command done")
    }).catch(function (e) {
        o.dequeueLogEntry(n, u, "dequeue command error " + e.message)
    })
}, de.biancoroyal.modbus.queue.core.getUnitIdToQueue = function (e, n) {
    return parseInt(n.payload.unitid) || parseInt(e.unit_id) || 0
}, de.biancoroyal.modbus.queue.core.isValidUnitId = function (e) {
    return 0 <= e || e <= 255
}, de.biancoroyal.modbus.queue.core.getQueueLengthByUnitId = function (e, n) {
    if (this.isValidUnitId(n)) return e.bufferCommandList.get(n).length;
    throw new Error("(0-255) Got A Wrong Unit-Id: " + n)
}, de.biancoroyal.modbus.queue.core.pushToQueueByUnitId = function (d, i, r, a, t) {
    var l = de.biancoroyal.modbus.queue.core;
    return new Promise(function (e, n) {
        try {
            var o = l.getUnitIdToQueue(d, r);
            if (!o) return void n(new Error("UnitId is valid from msg or node"));
            var u = l.getQueueLengthByUnitId(d, o);
            r.queueLengthByUnitId = {
                unitId: o,
                queueLength: u
            }, r.queueUnitId = o, d.parallelUnitIdsAllowed && "serial" !== d.clienttype || d.unitSendingAllowed.push(o), d.bufferCommandList.get(o).push({
                callModbus: i,
                msg: r,
                cb: a,
                cberr: t
            }), d.queueLog(JSON.stringify({
                info: "pushed to Queue by Unit-Id",
                message: r.payload,
                unitId: o
            })), e()
        } catch (e) {
            n(e)
        }
    })
}, module.exports = de.biancoroyal.modbus.queue.core;
//# sourceMappingURL=../maps/core/modbus-queue-core.js.map