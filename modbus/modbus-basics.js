"use strict";
require("source-map-support").install();
var de = de || {
    biancoroyal: {
        modbus: {
            basics: {}
        }
    }
};
de.biancoroyal.modbus.basics.internalDebug = de.biancoroyal.modbus.basics.internalDebug || require("debug")("contribModbus:basics"), de.biancoroyal.modbus.basics.util = de.biancoroyal.modbus.basics.util || require("util"), de.biancoroyal.modbus.basics.statusLog = !1, de.biancoroyal.modbus.basics.get_timeUnit_name = function (e) {
    var s = "";
    switch (e) {
        case "ms":
            s = "msec.";
            break;
        case "s":
            s = "sec.";
            break;
        case "m":
            s = "min.";
            break;
        case "h":
            s = "h."
    }
    return s
}, de.biancoroyal.modbus.basics.calc_rateByUnit = function (e, s) {
    switch (s) {
        case "ms":
            break;
        case "s":
            e = 1e3 * parseInt(e);
            break;
        case "m":
            e = 6e4 * parseInt(e);
            break;
        case "h":
            e = 36e5 * parseInt(e);
            break;
        default:
            e = 1e4
    }
    return e
}, de.biancoroyal.modbus.basics.setNodeStatusProperties = function (e, s) {
    var t = "yellow",
        o = "ring",
        a = (e = e || "waiting").value || e;
    switch (a) {
        case "connecting":
            t = "yellow", o = "ring";
            break;
        case "error":
            t = "red", o = "ring";
            break;
        case "initialized":
        case "init":
            t = "yellow", o = "dot";
            break;
        case "not ready to read":
        case "not ready to write":
            t = "yellow", o = "ring";
            break;
        case "connected":
        case "queueing":
        case "queue":
            t = "green", o = "ring";
            break;
        case "timeout":
            t = "red", o = "ring";
            break;
        case "active":
        case "reading":
        case "writing":
        case "active reading":
        case "active writing":
            s || (a = "active"), t = "green", o = "dot";
            break;
        case "disconnected":
        case "terminated":
            t = "red", o = "ring";
            break;
        case "stopped":
            t = "red", o = "dot";
            break;
        case "polling":
            t = "green", o = s ? "ring" : (a = "active", "dot");
            break;
        default:
            "waiting" === a && (t = "blue", a = "waiting ...")
    }
    return {
        fill: t,
        shape: o,
        status: a
    }
}, de.biancoroyal.modbus.basics.setNodeStatusByResponseTo = function (e, s, t) {
    var o = "red",
        a = "dot";
    switch (e) {
        case "initialized":
        case "queue":
            o = "green", a = "ring";
            break;
        case "active":
            o = "green", a = "dot";
            break;
        default:
            e && "waiting" !== e || (o = "blue", e = "waiting ...")
    }
    t.status({
        fill: o,
        shape: a,
        text: this.util.inspect(s, !1, null)
    })
}, de.biancoroyal.modbus.basics.setNodeStatusResponse = function (e, s) {
    s.status({
        fill: "green",
        shape: "dot",
        text: "active got length: " + e
    })
}, de.biancoroyal.modbus.basics.setModbusError = function (e, s, t, o) {
    if (t) switch (t.message) {
        case "Timed out":
            this.setNodeStatusTo("timeout", e);
            break;
        case "FSM Not Ready To Reconnect":
            this.setNodeStatusTo("not ready to reconnect", e);
            break;
        case "Port Not Open":
            this.setNodeStatusTo("reconnect", e), s.emit("reconnect");
            break;
        default:
            this.internalDebug(t.message), e.showErrors && this.setNodeStatusTo("error " + t.message, e)
    }
}, de.biancoroyal.modbus.basics.setNodeStatusTo = function (e, s) {
    var t;
    s.showStatusActivities && (e !== s.statusText ? (t = this.setNodeStatusProperties(e, s.showStatusActivities), s.statusText = e, s.status({
        fill: t.fill,
        shape: t.shape,
        text: t.status
    })) : this.setNodeDefaultStatus(s))
}, de.biancoroyal.modbus.basics.onModbusInit = function (e) {
    this.setNodeStatusTo("initialize", e)
}, de.biancoroyal.modbus.basics.onModbusConnect = function (e) {
    this.setNodeStatusTo("connected", e)
}, de.biancoroyal.modbus.basics.onModbusActive = function (e) {
    this.setNodeStatusTo("active", e)
}, de.biancoroyal.modbus.basics.onModbusError = function (e, s) {
    this.setNodeStatusTo("failure", e), e.showErrors && e.warn(s)
}, de.biancoroyal.modbus.basics.onModbusClose = function (e) {
    this.setNodeStatusTo("closed", e)
}, de.biancoroyal.modbus.basics.onModbusQueue = function (e) {
    this.setNodeStatusTo("queueing", e)
}, de.biancoroyal.modbus.basics.onModbusBroken = function (e, s) {
    this.setNodeStatusTo("reconnecting after " + s.reconnectTimeout + " msec.", e)
}, de.biancoroyal.modbus.basics.setNodeDefaultStatus = function (e) {
    e.status({
        fill: "green",
        shape: "ring",
        text: "active"
    })
}, de.biancoroyal.modbus.basics.initModbusClientEvents = function (s, e) {
    var t = this;
    s.showStatusActivities ? (e.on("mbinit", function () {
        t.onModbusInit(s)
    }), e.on("mbqueue", function () {
        t.onModbusQueue(s)
    }), e.on("mbconnected", function () {
        t.onModbusConnect(s)
    }), e.on("mbbroken", function () {
        t.onModbusBroken(s, e)
    }), e.on("mbactive", function () {
        t.onModbusActive(s)
    }), e.on("mberror", function (e) {
        t.onModbusError(s, e)
    }), e.on("mbclosed", function () {
        t.onModbusClose(s)
    })) : this.setNodeDefaultStatus(s)
}, de.biancoroyal.modbus.basics.invalidPayloadIn = function (e) {
    return !(e && Object.prototype.hasOwnProperty.call(e, "payload"))
}, de.biancoroyal.modbus.basics.invalidSequencesIn = function (e) {
    return !(e && Object.prototype.hasOwnProperty.call(e, "sequences"))
}, de.biancoroyal.modbus.basics.sendEmptyMsgOnFail = function (e, s, t) {
    e.emptyMsgOnFail && (t.payload = "", s && s.message && s.name ? t.error = s : t.error = Error(s), t.error.nodeStatus = e.statusText, e.send([t, t]))
}, de.biancoroyal.modbus.basics.logMsgError = function (e, s, t) {
    e.showErrors && e.error(s, t)
}, de.biancoroyal.modbus.basics.buildNewMessage = function (e, s, t) {
    return e ? Object.assign(s, t) : t
}, module.exports = de.biancoroyal.modbus.basics;
//# sourceMappingURL=maps/modbus-basics.js.map