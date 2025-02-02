"use strict";
module.exports = function (i) {
    require("source-map-support").install();
    var n = require("@runnane/modbus-serial-dupline"),
        u = require("./core/modbus-server-core"),
        d = require("./modbus-basics"),
        c = require("debug")("contribModbus:flex:server");
    try {
        i.nodes.registerType("modbus-flex-server", function (e) {
            i.nodes.createNode(this, e);
            var r = (s = require("vm2")).VM,
                s = s.VMScript;
            this.name = e.name, this.logEnabled = e.logEnabled, this.serverAddress = e.serverAddress || "0.0.0.0", this.serverPort = parseInt(e.serverPort), this.responseDelay = parseInt(e.responseDelay), this.delayUnit = e.delayUnit, this.unitId = parseInt(e.unitId) || 1, this.minAddress = parseInt(e.minAddress) || 0, this.splitAddress = parseInt(e.splitAddress) || 1e4, this.showErrors = e.showErrors, this.funcGetCoil = new s(e.funcGetCoil).compile(), this.funcGetDiscreteInput = new s(e.funcGetDiscreteInput).compile(), this.funcGetInputRegister = new s(e.funcGetInputRegister).compile(), this.funcGetHoldingRegister = new s(e.funcGetHoldingRegister).compile(), this.funcSetCoil = new s(e.funcSetCoil).compile(), this.funcSetRegister = new s(e.funcSetRegister).compile(), this.internalDebugLog = c, this.verboseLogging = i.settings.verbose;
            var t = this;

            function o(e) {
                return [{
                    type: "holding",
                    message: e,
                    payload: t.registers.slice(t.splitAddress * u.bufferFactor)
                }, {
                    type: "coils",
                    message: e,
                    payload: t.coils.slice(0, t.splitAddress * u.bufferFactor)
                }, {
                    type: "input",
                    message: e,
                    payload: t.registers.slice(0, t.splitAddress * u.bufferFactor)
                }, {
                    type: "discrete",
                    message: e,
                    payload: t.coils.slice(t.splitAddress * u.bufferFactor)
                }, {
                    payload: "request",
                    type: "message",
                    message: e
                }]
            }
            t.bufferFactor = u.bufferFactor, t.coilsBufferSize = parseInt(e.coilsBufferSize * u.bufferFactor), t.registersBufferSize = parseInt(e.registersBufferSize * u.bufferFactor), t.coils = Buffer.alloc(t.coilsBufferSize, 0), t.registers = Buffer.alloc(t.registersBufferSize, 0), t.modbusServer = null, d.setNodeStatusTo("initialized", t), t.vector = {}, (r = new r({
                sandbox: {
                    node: t
                }
            })).run("node.vector.getCoil = " + e.funcGetCoil), r.run("node.vector.getDiscreteInput = " + e.funcGetDiscreteInput), r.run("node.vector.getInputRegister = " + e.funcGetInputRegister), r.run("node.vector.getHoldingRegister = " + e.funcGetHoldingRegister), r.run("node.vector.setCoil = " + e.funcSetCoil), r.run("node.vector.setRegister = " + e.funcSetRegister), t.startServer = function () {
                try {
                    if (null === t.modbusServer) {
                        try {
                            t.modbusServer = new n.ServerTCP(t.vector, {
                                host: t.serverAddress,
                                port: t.serverPort,
                                debug: t.logEnabled,
                                unitID: t.unitId
                            })
                        } catch (e) {
                            t.error(e, {
                                payload: "server net error -> for port 502 on unix, you have to be a super user"
                            })
                        }
                        t.modbusServer.on("socketError", function (e) {
                            c(e.message), t.showErrors && t.warn(e), d.setNodeStatusTo("error", t), t.modbusServer.close(function () {
                                t.startServer()
                            })
                        }), t.modbusServer._server.on("connection", function (e) {
                            c("Modbus Flex Server client connection"), e && c("Modbus Flex Server client to " + JSON.stringify(e.address()) + " from " + e.remoteAddress + " " + e.remotePort), d.setNodeStatusTo("active", t)
                        })
                    }
                    t.showStatusActivities || d.setNodeDefaultStatus(t)
                } catch (e) {
                    c(e.message), t.showErrors && t.warn(e), d.setNodeStatusTo("error", t)
                }
                null != t.modbusServer ? (c("Modbus Flex Server listening on modbus://" + t.serverAddress + ":" + t.serverPort), d.setNodeStatusTo("initialized", t)) : (c("Modbus Flex Server isn't ready"), d.setNodeStatusTo("error", t))
            }, t.startServer(), t.on("input", function (e) {
                u.isValidMemoryMessage(e) ? (u.writeToFlexServerMemory(t, e), 1 !== e.payload.disableMsgOutput && t.send(o(e))) : (t.showErrors && t.error("Is Not A Valid Memory Write Message To Server", e), e.payload.disableMsgOutput || t.send(o(e)))
            }), t.on("close", function () {
                d.setNodeStatusTo("closed", t), t.modbusServer._server && t.modbusServer._server.close(), t.modbusServer && t.modbusServer.close(), t.modbusServer = null
            })
        })
    } catch (e) {
        c(e.message)
    }
};
//# sourceMappingURL=maps/modbus-flex-server.js.map