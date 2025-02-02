"use strict";
require("source-map-support").install();
var de = de || {
    biancoroyal: {
        modbus: {
            core: {
                client: {}
            }
        }
    }
};
de.biancoroyal.modbus.core.client.internalDebug = de.biancoroyal.modbus.core.client.internalDebug || require("debug")("contribModbus:core:client"), de.biancoroyal.modbus.core.client.internalDebugFSM = de.biancoroyal.modbus.core.client.internalDebugFSM || require("debug")("contribModbus:core:client:fsm"), de.biancoroyal.modbus.core.client.modbusSerialDebug = de.biancoroyal.modbus.core.client.modbusSerialDebug || require("debug")("modbus-serial"), de.biancoroyal.modbus.core.client.XStateFSM = de.biancoroyal.modbus.core.client.XStateFSM || require("@xstate/fsm"), de.biancoroyal.modbus.core.client.stateLogEnabled = de.biancoroyal.modbus.core.client.stateLogEnabled || !1, de.biancoroyal.modbus.core.client.networkErrors = ["ESOCKETTIMEDOUT", "ETIMEDOUT", "ECONNRESET", "ENETRESET", "ECONNABORTED", "ECONNREFUSED", "ENETUNREACH", "ENOTCONN", "ESHUTDOWN", "EHOSTDOWN", "ENETDOWN", "EWOULDBLOCK", "EAGAIN", "EHOSTUNREACH"], de.biancoroyal.modbus.core.client.createStateMachineService = function () {
    return this.stateLogEnabled = !1, this.XStateFSM.createMachine({
        id: "modbus",
        initial: "new",
        states: {
            new: {
                on: {
                    INIT: "init",
                    BREAK: "broken",
                    STOP: "stopped"
                }
            },
            broken: {
                on: {
                    INIT: "init",
                    STOP: "stopped",
                    FAILURE: "failed",
                    ACTIVATE: "activated",
                    RECONNECT: "reconnecting"
                }
            },
            reconnecting: {
                on: {
                    INIT: "init",
                    STOP: "stopped"
                }
            },
            init: {
                on: {
                    OPENSERIAL: "opened",
                    CONNECT: "connected",
                    BREAK: "broken",
                    FAILURE: "failed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            opened: {
                on: {
                    CONNECT: "connected",
                    BREAK: "broken",
                    FAILURE: "failed",
                    CLOSE: "closed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            connected: {
                on: {
                    CLOSE: "closed",
                    ACTIVATE: "activated",
                    QUEUE: "queueing",
                    BREAK: "broken",
                    FAILURE: "failed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            activated: {
                on: {
                    READ: "reading",
                    WRITE: "writing",
                    QUEUE: "queueing",
                    BREAK: "broken",
                    CLOSE: "closed",
                    FAILURE: "failed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            queueing: {
                on: {
                    ACTIVATE: "activated",
                    SEND: "sending",
                    READ: "reading",
                    WRITE: "writing",
                    EMPTY: "empty",
                    BREAK: "broken",
                    CLOSE: "closed",
                    FAILURE: "failed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            empty: {
                on: {
                    QUEUE: "queueing",
                    BREAK: "broken",
                    FAILURE: "failed",
                    CLOSE: "closed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            sending: {
                on: {
                    ACTIVATE: "activated",
                    READ: "reading",
                    WRITE: "writing",
                    BREAK: "broken",
                    FAILURE: "failed",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            reading: {
                on: {
                    ACTIVATE: "activated",
                    BREAK: "broken",
                    FAILURE: "failed",
                    STOP: "stopped"
                }
            },
            writing: {
                on: {
                    ACTIVATE: "activated",
                    BREAK: "broken",
                    FAILURE: "failed",
                    STOP: "stopped"
                }
            },
            closed: {
                on: {
                    FAILURE: "failed",
                    BREAK: "broken",
                    CONNECT: "connected",
                    RECONNECT: "reconnecting",
                    INIT: "init",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            failed: {
                on: {
                    CLOSE: "closed",
                    BREAK: "broken",
                    STOP: "stopped",
                    SWITCH: "switch"
                }
            },
            switch: {
                on: {
                    CLOSE: "closed",
                    BREAK: "broken",
                    STOP: "stopped"
                }
            },
            stopped: {
                on: {
                    NEW: "new",
                    STOP: "stopped"
                }
            }
        }
    })
}, de.biancoroyal.modbus.core.client.getActualUnitId = function (e, n) {
    return n.payload && Number.isInteger(n.payload.unitid) ? parseInt(n.payload.unitid) : Number.isInteger(n.queueUnitId) ? parseInt(n.queueUnitId) : parseInt(e.unit_id)
}, de.biancoroyal.modbus.core.client.startStateService = function (e) {
    return this.XStateFSM.interpret(e).start()
}, de.biancoroyal.modbus.core.client.checkUnitId = function (e, n) {
    return "tcp" === n ? 0 <= e && e <= 255 : 0 <= e && e <= 247
}, de.biancoroyal.modbus.core.client.getLogFunction = function (e) {
    return e.internalDebugLog || de.biancoroyal.modbus.core.client.internalDebug
}, de.biancoroyal.modbus.core.client.activateSendingOnSuccess = function (e, n, a, t, o) {
    e.activateSending(o).then(function () {
        n(t, o)
    }).catch(function (e) {
        a(e, o)
    }).finally(function () {
        e.stateService.send("ACTIVATE")
    })
}, de.biancoroyal.modbus.core.client.activateSendingOnFailure = function (e, n, a, t) {
    e.activateSending(t).then(function () {
        n(a, t)
    }).catch(function (e) {
        n(e, t)
    }).finally(function () {
        e.stateService.send("ACTIVATE")
    })
}, de.biancoroyal.modbus.core.client.readModbusByFunctionCodeOne = function (n, a, t, o) {
    var i = de.biancoroyal.modbus.core.client;
    n.client.readCoils(parseInt(a.payload.address), parseInt(a.payload.quantity)).then(function (e) {
        i.activateSendingOnSuccess(n, t, o, e, a)
    }).catch(function (e) {
        i.activateSendingOnFailure(n, o, new Error(e.message), a), n.modbusErrorHandling(e)
    })
}, de.biancoroyal.modbus.core.client.readModbusByFunctionCodeTwo = function (n, a, t, o) {
    var i = de.biancoroyal.modbus.core.client;
    n.client.readDiscreteInputs(parseInt(a.payload.address), parseInt(a.payload.quantity)).then(function (e) {
        i.activateSendingOnSuccess(n, t, o, e, a)
    }).catch(function (e) {
        i.activateSendingOnFailure(n, o, new Error(e.message), a), n.modbusErrorHandling(e)
    })
}, de.biancoroyal.modbus.core.client.readModbusByFunctionCodeThree = function (n, a, t, o) {
    var i = de.biancoroyal.modbus.core.client;
    n.client.readHoldingRegisters(parseInt(a.payload.address), parseInt(a.payload.quantity)).then(function (e) {
        i.activateSendingOnSuccess(n, t, o, e, a)
    }).catch(function (e) {
        i.activateSendingOnFailure(n, o, new Error(e.message), a), n.modbusErrorHandling(e)
    })
}, de.biancoroyal.modbus.core.client.readModbusByFunctionCodeFour = function (n, a, t, o) {
    var i = de.biancoroyal.modbus.core.client;
    n.client.readInputRegisters(parseInt(a.payload.address), parseInt(a.payload.quantity)).then(function (e) {
        i.activateSendingOnSuccess(n, t, o, e, a)
    }).catch(function (e) {
        i.activateSendingOnFailure(n, o, new Error(e.message), a), n.modbusErrorHandling(e)
    })
}, de.biancoroyal.modbus.core.client.readModbusByFunctionCode = function (e, n, a, t) {
    var o = de.biancoroyal.modbus.core.client,
        i = de.biancoroyal.modbus.core.client.getLogFunction(e);
    switch (parseInt(n.payload.fc)) {
        case 1:
            o.readModbusByFunctionCodeOne(e, n, a, t);
            break;
        case 2:
            o.readModbusByFunctionCodeTwo(e, n, a, t);
            break;
        case 3:
            o.readModbusByFunctionCodeThree(e, n, a, t);
            break;
        case 4:
            o.readModbusByFunctionCodeFour(e, n, a, t);
            break;
        default:
            o.activateSendingOnFailure(e, t, new Error("Function Code Unknown"), n), i("Function Code Unknown %s", n.payload.fc)
    }
}, de.biancoroyal.modbus.core.client.readModbus = function (n, a, e, t) {
    var o = de.biancoroyal.modbus.core.client,
        i = de.biancoroyal.modbus.core.client.getLogFunction(n);
    if (n.client) {
        n.bufferCommands ? n.queueLog(JSON.stringify({
            info: "read msg via Modbus",
            message: a.payload,
            queueUnitId: a.queueUnitId,
            timeout: n.client.getTimeout(),
            state: n.actualServiceState.value
        })) : "tcp" !== n.clienttype && n.stateService.send("READ"), n.setUnitIdFromPayload(a), n.client.setTimeout(n.clientTimeout);
        try {
            o.readModbusByFunctionCode(n, a, e, t)
        } catch (e) {
            i(e.message), n.modbusErrorHandling(e), o.activateSendingOnFailure(n, t, e, a)
        }
    } else i("Client Not Ready As Object On Reading Modbus")
}, de.biancoroyal.modbus.core.client.writeModbusByFunctionCodeFive = function (a, t, o, i) {
    var r = de.biancoroyal.modbus.core.client;
    t.payload.value ? t.payload.value = !0 : t.payload.value = !1, a.client.writeCoil(parseInt(t.payload.address), t.payload.value).then(function (e) {
        r.activateSendingOnSuccess(a, o, i, e, t)
    }).catch(function (e) {
        var n;
        0 === a.client.getID() ? (n = {
            address: parseInt(t.payload.address),
            value: parseInt(t.payload.value)
        }, r.activateSendingOnSuccess(a, o, i, n, t)) : (r.activateSendingOnFailure(a, i, e, t), a.modbusErrorHandling(e))
    })
}, de.biancoroyal.modbus.core.client.writeModbusByFunctionCodeFiveDupline = function (a, t, o, i) {
    var r = de.biancoroyal.modbus.core.client;
    a.client.writeCoilDupline(parseInt(t.payload.address), t.payload.value).then(function (e) {
        r.activateSendingOnSuccess(a, o, i, e, t)
    }).catch(function (e) {
        var n;
        0 === a.client.getID() ? (n = {
            address: parseInt(t.payload.address),
            value: t.payload.value
        }, r.activateSendingOnSuccess(a, o, i, n, t)) : (r.activateSendingOnFailure(a, i, e, t), a.modbusErrorHandling(e))
    })
}, de.biancoroyal.modbus.core.client.writeModbusByFunctionCodeFifteen = function (a, t, o, i) {
    var r = de.biancoroyal.modbus.core.client;
    parseInt(t.payload.value.length) !== parseInt(t.payload.quantity) ? r.activateSendingOnFailure(a, i, new Error("Quantity should be less or equal to coil payload array length: " + t.payload.value.length + " Addr: " + t.payload.address + " Q: " + t.payload.quantity), t) : a.client.writeCoils(parseInt(t.payload.address), t.payload.value).then(function (e) {
        r.activateSendingOnSuccess(a, o, i, e, t)
    }).catch(function (e) {
        var n;
        0 === a.client.getID() ? (n = {
            address: parseInt(t.payload.address),
            value: parseInt(t.payload.value)
        }, r.activateSendingOnSuccess(a, o, i, n, t)) : (r.activateSendingOnFailure(a, i, e, t), a.modbusErrorHandling(e))
    })
}, de.biancoroyal.modbus.core.client.writeModbusByFunctionCodeSix = function (a, t, o, i) {
    var r = de.biancoroyal.modbus.core.client;
    a.client.writeRegister(parseInt(t.payload.address), parseInt(t.payload.value)).then(function (e) {
        r.activateSendingOnSuccess(a, o, i, e, t)
    }).catch(function (e) {
        var n;
        0 === a.client.getID() ? (n = {
            address: parseInt(t.payload.address),
            value: parseInt(t.payload.value)
        }, r.activateSendingOnSuccess(a, o, i, n, t)) : (r.activateSendingOnFailure(a, i, e, t), a.modbusErrorHandling(e))
    })
}, de.biancoroyal.modbus.core.client.writeModbusByFunctionCodeSixteen = function (a, t, o, i) {
    var r = de.biancoroyal.modbus.core.client;
    parseInt(t.payload.value.length) !== parseInt(t.payload.quantity) ? r.activateSendingOnFailure(a, i, new Error("Quantity should be less or equal to register payload array length: " + t.payload.value.length + " Addr: " + t.payload.address + " Q: " + t.payload.quantity), t) : a.client.writeRegisters(parseInt(t.payload.address), t.payload.value).then(function (e) {
        r.activateSendingOnSuccess(a, o, i, e, t)
    }).catch(function (e) {
        var n;
        0 === a.client.getID() ? (n = {
            address: parseInt(t.payload.address),
            value: parseInt(t.payload.value)
        }, r.activateSendingOnSuccess(a, o, i, n, t)) : (r.activateSendingOnFailure(a, i, e, t), a.modbusErrorHandling(e))
    })
}, de.biancoroyal.modbus.core.client.writeModbus = function (n, a, e, t) {
    var o = de.biancoroyal.modbus.core.client,
        i = de.biancoroyal.modbus.core.client.getLogFunction(n);
    if (n.client) {
        n.bufferCommands ? n.queueLog(JSON.stringify({
            info: "write msg",
            message: a.payload,
            queueUnitId: a.queueUnitId,
            timeout: n.client.getTimeout(),
            state: n.actualServiceState.value
        })) : "tcp" !== n.clienttype && n.stateService.send("WRITE"), n.setUnitIdFromPayload(a), n.client.setTimeout(n.clientTimeout);
        try {
            switch (parseInt(a.payload.fc)) {
                case 15:
                    o.writeModbusByFunctionCodeFifteen(n, a, e, t);
                    break;
                case 5:
                    o.writeModbusByFunctionCodeFive(n, a, e, t);
                    break;
                case 50:
                    o.writeModbusByFunctionCodeFiveDupline(n, a, e, t);
                    break;
                case 16:
                    o.writeModbusByFunctionCodeSixteen(n, a, e, t);
                    break;
                case 6:
                    o.writeModbusByFunctionCodeSix(n, a, e, t);
                    break;
                default:
                    o.activateSendingOnFailure(n, t, new Error("Function Code Unknown"), a), i("Function Code Unknown %s", a.payload.fc)
            }
        } catch (e) {
            i(e.message), o.activateSendingOnFailure(n, t, e, a), n.modbusErrorHandling(e)
        }
    } else i("Client Not Ready As Object On Writing Modbus")
}, de.biancoroyal.modbus.core.client.setNewTCPNodeSettings = function (e, n) {
    e.tcpHost = n.payload.tcpHost || e.tcpHost, e.tcpPort = n.payload.tcpPort || e.tcpPort, e.tcpType = n.payload.tcpType || e.tcpType
}, de.biancoroyal.modbus.core.client.setNewSerialNodeSettings = function (e, n) {
    n.payload.serialPort && (e.serialPort = n.payload.serialPort || e.serialPort), n.payload.serialBaudrate && (e.serialBaudrate = parseInt(n.payload.serialBaudrate) || e.serialBaudrate), e.serialDatabits = n.payload.serialDatabits || e.serialDatabits, e.serialStopbits = n.payload.serialStopbits || e.serialStopbits, e.serialParity = n.payload.serialParity || e.serialParity, e.serialType = n.payload.serialType || e.serialType, n.payload.serialAsciiResponseStartDelimiter && "string" == typeof n.payload.serialAsciiResponseStartDelimiter ? e.serialAsciiResponseStartDelimiter = parseInt(n.payload.serialAsciiResponseStartDelimiter, 16) : e.serialAsciiResponseStartDelimiter = n.payload.serialAsciiResponseStartDelimiter || e.serialAsciiResponseStartDelimiter, n.payload.serialConnectionDelay && (e.serialConnectionDelay = parseInt(n.payload.serialConnectionDelay) || e.serialConnectionDelay)
}, de.biancoroyal.modbus.core.client.setNewNodeOptionalSettings = function (e, n) {
    n.payload.unitId && (e.unit_id = parseInt(n.payload.unitId) || e.unit_id), n.payload.commandDelay && (e.commandDelay = parseInt(n.payload.commandDelay) || e.commandDelay), n.payload.clientTimeout && (e.clientTimeout = parseInt(n.payload.clientTimeout) || e.clientTimeout), n.payload.reconnectTimeout && (e.reconnectTimeout = parseInt(n.payload.reconnectTimeout) || e.reconnectTimeout)
}, de.biancoroyal.modbus.core.client.setNewNodeSettings = function (e, n) {
    var a = de.biancoroyal.modbus.core.client.getLogFunction(e),
        t = de.biancoroyal.modbus.core.client;
    if (!n) return a("New Connection message invalid."), !1;
    switch (n.payload.connectorType.toUpperCase()) {
        case "TCP":
            t.setNewTCPNodeSettings(e, n), a("New Connection TCP Settings " + e.tcpHost + " " + e.tcpPort + " " + e.tcpType);
            break;
        case "SERIAL":
            t.setNewSerialNodeSettings(e, n), a("New Connection Serial Settings " + e.serialPort + " " + e.serialBaudrate + " " + e.serialType);
            break;
        default:
            a("Unknown Dynamic Reconnect Type " + n.payload.connectorType)
    }
    return t.setNewNodeOptionalSettings(e, n), !0
}, de.biancoroyal.modbus.core.client.messagesAllowedStates = ["activated", "queueing", "sending", "empty", "connected"], module.exports = de.biancoroyal.modbus.core.client;
//# sourceMappingURL=../maps/core/modbus-client-core.js.map