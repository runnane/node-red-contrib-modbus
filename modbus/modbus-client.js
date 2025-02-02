"use strict";
module.exports = function (a) {
    require("source-map-support").install();
    var c = require("./modbus-basics"),
        l = require("./core/modbus-client-core"),
        u = require("./core/modbus-queue-core"),
        d = require("debug")("contribModbus:config:client");
    a.nodes.registerType("modbus-client", function (e) {
        a.nodes.createNode(this, e);
        var t = require("@runnane/modbus-serial-dupline"),
            n = 500,
            i = " Get More About It By Logging";
        this.clienttype = e.clienttype, void 0 === e.parallelUnitIdsAllowed ? this.bufferCommands = !0 : this.bufferCommands = e.bufferCommands, this.queueLogEnabled = e.queueLogEnabled, this.stateLogEnabled = e.stateLogEnabled, this.tcpHost = e.tcpHost, this.tcpPort = parseInt(e.tcpPort) || 502, this.tcpType = e.tcpType, this.serialPort = e.serialPort, this.serialBaudrate = e.serialBaudrate, this.serialDatabits = e.serialDatabits, this.serialStopbits = e.serialStopbits, this.serialParity = e.serialParity, this.serialType = e.serialType, this.serialConnectionDelay = parseInt(e.serialConnectionDelay) || n, this.serialAsciiResponseStartDelimiter = e.serialAsciiResponseStartDelimiter || "0x3A", this.unit_id = parseInt(e.unit_id), this.commandDelay = parseInt(e.commandDelay) || 1, this.clientTimeout = parseInt(e.clientTimeout) || 1e3, this.reconnectTimeout = parseInt(e.reconnectTimeout) || 2e3, this.reconnectOnTimeout = e.reconnectOnTimeout, void 0 === e.parallelUnitIdsAllowed ? this.parallelUnitIdsAllowed = !0 : this.parallelUnitIdsAllowed = e.parallelUnitIdsAllowed;
        var o = this;

        function r(e) {
            a.settings.verbose && o.warn("Client -> " + e + o.serverInfo)
        }

        function s(e) {
            a.settings.verbose && l.internalDebug("Client -> " + e + o.serverInfo)
        }
        o.isFirstInitOfConnection = !0, o.closingModbus = !1, o.client = null, o.bufferCommandList = new Map, o.sendingAllowed = new Map, o.unitSendingAllowed = [], o.messageAllowedStates = l.messagesAllowedStates, o.serverInfo = "", o.stateMachine = null, o.stateService = null, o.stateMachine = l.createStateMachineService(), o.actualServiceState = o.stateMachine.initialState, o.actualServiceStateBefore = o.actualServiceState, o.stateService = l.startStateService(o.stateMachine), o.reconnectTimeoutId = 0, o.serialSendingAllowed = !1, o.internalDebugLog = d, u.queueSerialLockCommand(o), o.setDefaultUnitId = function () {
            "tcp" === this.clienttype ? o.unit_id = 0 : o.unit_id = 1
        }, o.setUnitIdFromPayload = function (e) {
            var t = l.getActualUnitId(o, e);
            l.checkUnitId(t, o.clienttype) || o.setDefaultUnitId(), o.client.setID(t), e.unitId = t
        }, !Number.isNaN(o.unit_id) && l.checkUnitId(o.unit_id, o.clienttype) || o.setDefaultUnitId(), o.updateServerinfo = function () {
            "tcp" === o.clienttype ? o.serverInfo = " TCP@" + o.tcpHost + ":" + o.tcpPort : o.serverInfo = " Serial@" + o.serialPort + ":" + o.serialBaudrate + "bit/s", o.serverInfo += " default Unit-Id: " + o.unit_id
        }, o.queueLog = function (e) {
            o.bufferCommands && o.queueLogEnabled && s(e)
        }, o.stateService.subscribe(function (e) {
            var t;
            if (o.actualServiceStateBefore = o.actualServiceState, o.actualServiceState = e, t = e.value, o.stateLogEnabled && s(t), e.value && void 0 !== o.actualServiceState.value && o.actualServiceStateBefore.value !== o.actualServiceState.value) {
                if (e.matches("init")) {
                    r("fsm init state after " + o.actualServiceStateBefore.value), o.updateServerinfo(), u.initQueue(o), o.reconnectTimeoutId = 0;
                    try {
                        o.isFirstInitOfConnection ? (o.isFirstInitOfConnection = !1, r("first fsm init in 500 ms"), setTimeout(o.connectClient, n)) : (r("fsm init in " + o.reconnectTimeout + " ms"), setTimeout(o.connectClient, o.reconnectTimeout))
                    } catch (e) {
                        o.error(e, {
                            payload: "client connection error " + i
                        })
                    }
                    o.emit("mbinit")
                }
                e.matches("connected") && (r("fsm connected after state " + o.actualServiceStateBefore.value + i), u.queueSerialUnlockCommand(o), o.emit("mbconnected")), e.matches("activated") && (o.emit("mbactive"), o.bufferCommands && !u.checkQueuesAreEmpty(o) && o.stateService.send("QUEUE")), e.matches("queueing") && ("tcp" === o.clienttype ? o.stateService.send("SEND") : o.serialSendingAllowed && (u.queueSerialLockCommand(o), o.stateService.send("SEND"))), e.matches("sending") && (setTimeout(function () {
                    u.dequeueCommand(o)
                }, o.commandDelay), o.emit("mbqueue")), e.matches("opened") && (u.queueSerialUnlockCommand(o), o.emit("mbopen")), e.matches("switch") && (o.emit("mbswitch"), o.stateService.send("CLOSE")), e.matches("closed") && (o.emit("mbclosed"), o.stateService.send("RECONNECT")), e.matches("stopped") && (r("stopped state without reconnecting"), o.emit("mbclosed")), e.matches("failed") && (r("fsm failed state after " + o.actualServiceStateBefore.value + i), o.emit("mberror", "Modbus Failure On State " + o.actualServiceStateBefore.value + i), o.stateService.send("BREAK")), e.matches("broken") && (r("fsm broken state after " + o.actualServiceStateBefore.value + i), o.emit("mbbroken", "Modbus Broken On State " + o.actualServiceStateBefore.value + i), o.reconnectOnTimeout ? o.stateService.send("RECONNECT") : o.stateService.send("ACTIVATE")), e.matches("reconnecting") && (r("fsm reconnect state after " + o.actualServiceStateBefore.value + i), u.queueSerialLockCommand(o), o.emit("mbreconnecting"), o.reconnectTimeout <= 0 && (o.reconnectTimeout = 2e3), setTimeout(function () {
                    o.reconnectTimeoutId = 0, o.stateService.send("INIT")
                }, o.reconnectTimeout))
            }
        }), o.connectClient = function () {
            if (o.client) try {
                o.client.close(function () {
                    s("connection closed")
                }), s("connection close sent")
            } catch (e) {
                s(e.message)
            }
            if (o.client = null, o.client = new t, o.clientTimeout || (o.clientTimeout = 1e3), o.reconnectTimeout || (o.reconnectTimeout = 2e3), "tcp" === o.clienttype) {
                if (!l.checkUnitId(o.unit_id, o.clienttype)) return o.error(new Error("wrong unit-id (0..255)"), {
                    payload: o.unit_id
                }), void o.stateService.send("FAILURE");
                switch (o.tcpType) {
                    case "C701":
                        s("C701 port UDP bridge"), o.client.connectC701(o.tcpHost, {
                            port: o.tcpPort,
                            autoOpen: !0
                        }).then(o.setTCPConnectionOptions).then(o.setTCPConnected).catch(o.modbusTcpErrorHandling);
                        break;
                    case "TELNET":
                        s("Telnet port"), o.client.connectTelnet(o.tcpHost, {
                            port: o.tcpPort,
                            autoOpen: !0
                        }).then(o.setTCPConnectionOptions).catch(o.modbusTcpErrorHandling);
                        break;
                    case "TCP-RTU-BUFFERED":
                        s("TCP RTU buffered port"), o.client.connectTcpRTUBuffered(o.tcpHost, {
                            port: o.tcpPort,
                            autoOpen: !0
                        }).then(o.setTCPConnectionOptions).catch(o.modbusTcpErrorHandling);
                        break;
                    default:
                        s("TCP port"), o.client.connectTCP(o.tcpHost, {
                            port: o.tcpPort,
                            autoOpen: !0
                        }).then(o.setTCPConnectionOptions).catch(o.modbusTcpErrorHandling)
                }
            } else {
                if (!l.checkUnitId(o.unit_id, o.clienttype)) return o.error(new Error("wrong unit-id serial (0..247)"), {
                    payload: o.unit_id
                }), void o.stateService.send("FAILURE");
                if (o.serialConnectionDelay || (o.serialConnectionDelay = n), !o.serialPort) return o.error(new Error("wrong serial port"), {
                    payload: o.serialPort
                }), void o.stateService.send("FAILURE");
                var e = {
                    baudRate: parseInt(o.serialBaudrate),
                    dataBits: parseInt(o.serialDatabits),
                    stopBits: parseInt(o.serialStopbits),
                    parity: o.serialParity,
                    autoOpen: !1
                };
                switch (o.serialType) {
                    case "ASCII":
                        s("ASCII port serial"), o.serialAsciiResponseStartDelimiter && "string" == typeof o.serialAsciiResponseStartDelimiter ? e.startOfSlaveFrameChar = parseInt(o.serialAsciiResponseStartDelimiter, 16) : e.startOfSlaveFrameChar = o.serialAsciiResponseStartDelimiter, s("Using response delimiter: 0x" + e.startOfSlaveFrameChar.toString(16)), o.client.connectAsciiSerial(o.serialPort, e).then(o.setSerialConnectionOptions).catch(o.modbusSerialErrorHandling);
                        break;
                    case "RTU":
                        s("RTU port serial"), o.client.connectRTU(o.serialPort, e).then(o.setSerialConnectionOptions).catch(o.modbusSerialErrorHandling);
                        break;
                    default:
                        s("RTU buffered port serial"), o.client.connectRTUBuffered(o.serialPort, e).then(o.setSerialConnectionOptions).catch(o.modbusSerialErrorHandling)
                }
            }
        }, o.setTCPConnectionOptions = function () {
            o.client.setID(o.unit_id), o.client.setTimeout(o.clientTimeout), o.stateService.send("CONNECT")
        }, o.setTCPConnected = function () {
            l.modbusSerialDebug("modbus tcp connected on " + o.tcpHost)
        }, o.setSerialConnectionOptions = function () {
            o.stateService.send("OPENSERIAL"), setTimeout(o.openSerialClient, parseInt(o.serialConnectionDelay))
        }, o.modbusErrorHandling = function (e) {
            u.queueSerialUnlockCommand(o), e.message ? l.modbusSerialDebug("modbusErrorHandling:" + e.message) : l.modbusSerialDebug("modbusErrorHandling:" + JSON.stringify(e)), e.errno && l.networkErrors.includes(e.errno) && o.stateService.send("FAILURE")
        }, o.modbusTcpErrorHandling = function (e) {
            u.queueSerialUnlockCommand(o), o.showErrors && o.error(e), e.message ? l.modbusSerialDebug("modbusTcpErrorHandling:" + e.message) : l.modbusSerialDebug("modbusTcpErrorHandling:" + JSON.stringify(e)), (e.errno && l.networkErrors.includes(e.errno) || e.code && l.networkErrors.includes(e.code)) && o.stateService.send("BREAK")
        }, o.modbusSerialErrorHandling = function (e) {
            u.queueSerialUnlockCommand(o), o.showErrors && o.error(e), e.message ? l.modbusSerialDebug("modbusSerialErrorHandling:" + e.message) : l.modbusSerialDebug("modbusSerialErrorHandling:" + JSON.stringify(e)), o.stateService.send("BREAK")
        }, o.openSerialClient = function () {
            "opened" === o.actualServiceState.value ? (s("time to open Unit " + o.unit_id), l.modbusSerialDebug("modbus connection opened"), o.client.setID(o.unit_id), o.client.setTimeout(parseInt(o.clientTimeout)), o.client._port.on("close", o.onModbusClose), o.stateService.send("CONNECT")) : (s("wrong state on connect serial " + o.actualServiceState.value), l.modbusSerialDebug("modbus connection not opened state is %s", o.actualServiceState.value), o.stateService.send("BREAK"))
        }, o.onModbusClose = function () {
            u.queueSerialUnlockCommand(o), r("Modbus closed port"), l.modbusSerialDebug("modbus closed port"), o.stateService.send("CLOSE")
        }, o.on("readModbus", function (t, e, n) {
            var i = o.actualServiceState; - 1 === o.messageAllowedStates.indexOf(i.value) ? n(new Error("Client Not Ready To Read At State " + i.value), t) : o.bufferCommands ? u.pushToQueueByUnitId(o, l.readModbus, t, e, n).then(function () {
                o.queueLog(JSON.stringify({
                    info: "queued read msg",
                    message: t.payload,
                    state: i.value,
                    queueLength: o.bufferCommandList.get(t.queueUnitId).length
                }))
            }).catch(function (e) {
                n(e, t)
            }).finally(function () {
                o.stateService.send("QUEUE")
            }) : l.readModbus(o, t, e, n)
        }), o.on("writeModbus", function (t, e, n) {
            var i = o.actualServiceState; - 1 === o.messageAllowedStates.indexOf(i.value) ? n(new Error("Client Not Ready To Write At State " + i.value), t) : o.bufferCommands ? u.pushToQueueByUnitId(o, l.writeModbus, t, e, n).then(function () {
                o.queueLog(JSON.stringify({
                    info: "queued write msg",
                    message: t.payload,
                    state: i.value,
                    queueLength: o.bufferCommandList.get(t.queueUnitId).length
                }))
            }).catch(function (e) {
                n(e, t)
            }).finally(function () {
                o.stateService.send("QUEUE")
            }) : l.writeModbus(o, t, e, n)
        }), o.activateSending = function (n) {
            return o.sendingAllowed.set(n.queueUnitId, !0), u.queueSerialUnlockCommand(o), new Promise(function (e, t) {
                try {
                    o.bufferCommands && (o.queueLog(JSON.stringify({
                        info: "queue response activate sending",
                        queueLength: o.bufferCommandList.length,
                        sendingAllowed: o.sendingAllowed.get(n.queueUnitId),
                        serialSendingAllowed: o.serialSendingAllowed,
                        queueUnitId: n.queueUnitId
                    })), u.checkQueuesAreEmpty(o) && o.stateService.send("EMPTY")), e()
                } catch (e) {
                    t(e)
                }
            })
        }, s("initialized"), o.setMaxListeners(0), o.on("reconnect", function () {
            o.stateService.send("CLOSE")
        }), o.on("dynamicReconnect", function (e, t, n) {
            if (c.invalidPayloadIn(e)) throw new Error("Message Or Payload Not Valid");
            l.internalDebug("Dynamic Reconnect Parameters " + JSON.stringify(e.payload)), l.setNewNodeSettings(o, e) ? t(e) : n(new Error("Message Or Payload Not Valid"), e), l.internalDebug("Dynamic Reconnect Starts on actual state " + o.actualServiceState.value), o.stateService.send("SWITCH")
        }), o.on("close", function (t) {
            var n = o.name || o.id;
            o.closingModbus = !0, s("stop fsm on close " + n), o.stateService.send("STOP"), s("close node " + n), o.internalDebugLog("close node " + n), o.removeAllListeners(), o.client ? o.client.isOpen ? o.client.close(function (e) {
                s(e ? "Connection closed with error " + n : "Connection closed well " + n), t()
            }) : (s("connection was closed " + n), t()) : (s("Connection closed simple " + n), t())
        }), o.registeredNodeList = {}, o.registerForModbus = function (e) {
            o.registeredNodeList[e] = e, 1 === Object.keys(o.registeredNodeList).length && (o.closingModbus = !1, o.stateService.send("NEW"), o.stateService.send("INIT")), o.emit("mbregister", e)
        }, o.setStoppedState = function (e, t) {
            o.stateService.send("STOP"), o.emit("mbderegister", e), t()
        }, o.closeConnectionWithoutRegisteredNodes = function (e, t) {
            0 === Object.keys(o.registeredNodeList).length ? (o.closingModbus = !0, o.client && "stopped" !== o.actualServiceState.value && o.client.isOpen ? o.client.close(function () {
                o.setStoppedState(e, t)
            }) : o.setStoppedState(e, t)) : o.setStoppedState(e, t)
        }, o.deregisterForModbus = function (t, n) {
            try {
                delete o.registeredNodeList[t], o.closingModbus ? (n(), o.emit("mbderegister", t)) : o.closeConnectionWithoutRegisteredNodes(t, n)
            } catch (e) {
                r(e.message + " on de-register node " + t), o.error(e), n()
            }
        }
    }), a.httpAdmin.get("/modbus/serial/ports", a.auth.needsPermission("serial.read"), function (e, t) {
        require("serialport").list().then(function (e) {
            t.json(e)
        }).catch(function (e) {
            t.json([e.message]), l.internalDebug(e.message)
        })
    })
};
//# sourceMappingURL=maps/modbus-client.js.map