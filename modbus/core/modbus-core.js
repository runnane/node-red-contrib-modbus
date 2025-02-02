"use strict";
require("source-map-support").install();
var de = de || {
    biancoroyal: {
        modbus: {
            core: {}
        }
    }
};
de.biancoroyal.modbus.core.internalDebug = de.biancoroyal.modbus.core.internalDebug || require("debug")("contribModbus:core"), de.biancoroyal.modbus.core.ObjectID = de.biancoroyal.modbus.core.ObjectID || require("bson").ObjectID, de.biancoroyal.modbus.core.getObjectId = function () {
    return new de.biancoroyal.modbus.core.ObjectID
}, de.biancoroyal.modbus.core.getOriginalMessage = function (e, o) {
    var r = e.get(o.payload.messageId || o.messageId);
    return r && r.messageId ? e.delete(r.messageId) || de.biancoroyal.modbus.core.internalDebug("WARNING: getOriginalMessage could not delete message from map " + r.messageId) : (de.biancoroyal.modbus.core.internalDebug("Message Not Found " + o.payload.messageId), r = o), r
}, de.biancoroyal.modbus.core.functionCodeModbusRead = function (e) {
    switch (e) {
        case "Coil":
            return 1;
        case "Input":
            return 2;
        case "HoldingRegister":
            return 3;
        case "InputRegister":
            return 4;
        default:
            return -1
    }
}, de.biancoroyal.modbus.core.functionCodeModbusWrite = function (e) {
    switch (e) {
        case "Coil":
            return 5;
        case "HoldingRegister":
            return 6;
        case "MCoils":
            return 15;
        case "MHoldingRegisters":
            return 16;
        default:
            return -1
    }
}, de.biancoroyal.modbus.core.buildMessage = function (e, o, r, a) {
    e = this.getOriginalMessage(e, a);
    e.payload = o, e.topic = a.topic, e.responseBuffer = r, e.input = Object.assign({}, a);
    a = Object.assign({}, e);
    return a.payload = r, a.values = o, delete a.responseBuffer, [e, a]
}, module.exports = de.biancoroyal.modbus.core;
//# sourceMappingURL=../maps/core/modbus-core.js.map