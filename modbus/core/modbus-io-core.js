"use strict";
require("source-map-support").install();
var de = de || {
    biancoroyal: {
        modbus: {
            io: {
                core: {}
            }
        }
    }
};
de.biancoroyal.modbus.io.core.internalDebug = de.biancoroyal.modbus.io.core.internalDebug || require("debug")("contribModbus:io:core"), de.biancoroyal.modbus.io.core.LineByLineReader = de.biancoroyal.modbus.io.core.LineByLineReader || require("line-by-line"), de.biancoroyal.modbus.io.core.core = de.biancoroyal.modbus.io.core.core || require("./modbus-core"), de.biancoroyal.modbus.io.core.nameValuesFromIOFile = function (r, e, s, a, t) {
    var i = [],
        d = de.biancoroyal.modbus.io.core;
    return r.ioFile && r.ioFile.configData && r.ioFile.configData.forEach(function (e) {
        e.valueAddress && e.valueAddress.startsWith("%I") && i.push(d.buildInputAddressMapping("MB-INPUTS", e, Number(r.ioFile.addressOffset), Number(t), r.logIOActivities)), e.valueAddress && e.valueAddress.startsWith("%Q") && i.push(d.buildOutputAddressMapping("MB-OUTPUTS", e, Number(r.ioFile.addressOffset), Number(t), r.logIOActivities))
    }), i = d.insertValues(i, s, r.logIOActivities), d.convertValuesByType(i, s, a, r.logIOActivities)
}, de.biancoroyal.modbus.io.core.allValueNamesFromIOFile = function (r) {
    var s = [],
        a = de.biancoroyal.modbus.io.core;
    return r && r.configData && r.configData.forEach(function (e) {
        e.valueAddress && e.valueAddress.startsWith("%I") && s.push(a.buildInputAddressMapping("MB-INPUTS", e, Number(r.addressOffset), 0)), e.valueAddress && e.valueAddress.startsWith("%Q") && s.push(a.buildOutputAddressMapping("MB-OUTPUTS", e, Number(r.addressOffset), 0))
    }), s
}, de.biancoroyal.modbus.io.core.getDataTypeFromFirstCharType = function (e) {
    switch (e) {
        case "w":
            return "Word";
        case "d":
            return "Double";
        case "r":
            return "Real";
        case "f":
            return "Float";
        case "i":
            return "Integer";
        case "l":
            return "Long";
        case "b":
            return "Boolean";
        default:
            return "Unsigned Integer"
    }
}, de.biancoroyal.modbus.io.core.buildInputAddressMapping = function (e, r, s, a, t) {
    var i = de.biancoroyal.modbus.io.core,
        d = 0,
        o = 0,
        u = 0,
        n = 0,
        l = null,
        b = r.name.substring(0, 1),
        c = r.valueAddress.substring(2, 3),
        m = r.valueAddress.substring(0, 3);
    switch (b) {
        case "w":
        case "u":
            d = Number(r.valueAddress.split(m)[1]), u = 1, n = 16;
            break;
        case "i":
            d = Number(r.valueAddress.split(m)[1]), n = "W" === c ? (u = 1, 16) : (u = 2, 32);
            break;
        case "r":
        case "f":
            d = Number(r.valueAddress.split(m)[1]), u = 2, n = 32;
            break;
        case "d":
            d = Number(r.valueAddress.split(m)[1]), u = 4, n = 64;
            break;
        case "l":
            d = Number(r.valueAddress.split(m)[1]), u = 5, n = 80;
            break;
        case "b":
            "X" === c && (l = r.valueAddress.split("%IX")[1].split("."), d = Math.floor(Number(l[0]) / 2), o = 8 * Number(l[0]) + Number(l[1]), n = u = 1);
            break;
        default:
            t && i.internalDebug("unknown input type " + b), n = 0
    }
    if (n) {
        var g = d - (Number(s) || 0);
        return {
            register: e,
            name: r.name,
            addressStart: d,
            addressOffset: u,
            addressOffsetIO: Number(s) || 0,
            addressStartIO: g,
            registerAddress: g - Number(a),
            coilStart: o,
            bitAddress: l,
            Bit: l ? 8 * Number(l[0]) + Number(l[1]) : 0,
            bits: n,
            dataType: i.getDataTypeFromFirstCharType(b),
            type: "input"
        }
    }
    return {
        name: r.name,
        type: b,
        mapping: r,
        error: "variable name does not match input mapping"
    }
}, de.biancoroyal.modbus.io.core.buildOutputAddressMapping = function (e, r, s, a, t) {
    var i = de.biancoroyal.modbus.io.core,
        d = 0,
        o = 0,
        u = 0,
        n = 0,
        l = null,
        b = r.name.substring(0, 1),
        c = r.valueAddress.substring(2, 3),
        m = r.valueAddress.substring(0, 3);
    switch (b) {
        case "w":
        case "u":
            d = Number(r.valueAddress.split(m)[1]), u = 1, n = 16;
            break;
        case "i":
            d = Number(r.valueAddress.split(m)[1]), n = "W" === c ? (u = 1, 16) : (u = 2, 32);
            break;
        case "r":
        case "f":
            d = Number(r.valueAddress.split(m)[1]), u = 2, n = 32;
            break;
        case "d":
            d = Number(r.valueAddress.split(m)[1]), u = 4, n = 64;
            break;
        case "l":
            d = Number(r.valueAddress.split(m)[1]), u = 5, n = 80;
            break;
        case "b":
            "X" === c && (l = r.valueAddress.split("%QX")[1].split("."), d = Math.floor(Number(l[0]) / 2), o = 8 * Number(l[0]) + Number(l[1]), n = u = 1);
            break;
        default:
            t && i.internalDebug("unknown output type " + b), n = 0
    }
    if (n) {
        var g = d - (Number(s) || 0);
        return {
            register: e,
            name: r.name,
            addressStart: d,
            addressOffset: u,
            addressOffsetIO: Number(s) || 0,
            addressStartIO: g,
            registerAddress: g - Number(a),
            coilStart: o,
            bitAddress: l,
            Bit: l ? 8 * Number(l[0]) + Number(l[1]) : 0,
            bits: n,
            dataType: i.getDataTypeFromFirstCharType(b),
            type: "output"
        }
    }
    return {
        name: r.name,
        type: b,
        mapping: r,
        error: "variable name does not match output mapping"
    }
}, de.biancoroyal.modbus.io.core.insertValues = function (e, r, s) {
    var a = de.biancoroyal.modbus.io.core,
        t = 0;
    for (t in e) {
        var i = e[t];
        if (!i || !Object.prototype.hasOwnProperty.call(i, "registerAddress") || i.registerAddress < 0) s && a.internalDebug("Item Not Valid To Insert Value " + JSON.stringify(i));
        else {
            if (de.biancoroyal.modbus.io.core.isRegisterSizeWrong(r, i.registerAddress, Number(i.bits))) {
                s && a.internalDebug("Insert Value Register Reached At Address-Start-IO:" + i.registerAddress + " Bits:" + Number(i.bits));
                break
            }
            switch (Number(i.bits)) {
                case 1:
                    i.value = !!(r[i.registerAddress] & Math.pow(i.bitAddress[1], 2));
                    break;
                case 16:
                    i.value = r[i.registerAddress];
                    break;
                case 32:
                    i.value = r[i.registerAddress + 1] << 16 | r[i.registerAddress];
                    break;
                case 64:
                    i.value = r[i.registerAddress + 3] << 48 | r[i.registerAddress + 2] << 32 | r[i.registerAddress + 1] << 16 | r[i.registerAddress];
                    break;
                case 80:
                    i.value = r[i.registerAddress + 4] << 64 | r[i.registerAddress + 3] << 48 | r[i.registerAddress + 2] << 32 | r[i.registerAddress + 1] << 16 | r[i.registerAddress];
                    break;
                default:
                    i.value = null
            }
        }
    }
    return e
}, de.biancoroyal.modbus.io.core.getValueFromBufferByDataType = function (e, r, s, a) {
    var t = de.biancoroyal.modbus.io.core,
        i = s.length / 2;
    if (r < 0 || r > s.length) return a && (t.internalDebug("Wrong Buffer Access Parameter Type:" + e.dataType + " Register-Length: " + i + " Buffer-Length:" + s.length + " Address-Buffer-Offset:" + r), t.internalDebug(JSON.stringify(e))), e;
    switch (a && t.internalDebug("Get Value From Buffer By Data Type:" + e.dataType + " Register:" + e.registerAddress + " Bits:" + Number(e.bits)), e.dataType) {
        case "Boolean":
            e.value = !!(s.readUInt16BE(r) & Math.pow(e.bitAddress[1], 2));
            break;
        case "Word":
            "8" === e.bits ? e.value = s.readInt8(r) : (e.value = s.readInt16BE(r), e.convertedValue = !1);
            break;
        case "Integer":
            switch (e.bits) {
                case "8":
                    e.value = s.readInt8(r);
                    break;
                case "32":
                    e.value = s.readInt32BE(r);
                    break;
                case "64":
                    e.value = s.readIntBE(r, 8);
                    break;
                default:
                    e.value = s.readInt16BE(r)
            }
            break;
        case "Real":
        case "Float":
            e.value = s.readFloatBE(r, 4);
            break;
        case "Double":
            e.value = s.readDoubleBE(r, 8);
            break;
        case "Long":
            e.value = s.readDoubleBE(r, 10);
            break;
        default:
            switch (e.bits) {
                case "8":
                    e.value = s.readUInt8(r);
                    break;
                case "32":
                    e.value = s.readUInt32BE(r);
                    break;
                case "64":
                    e.value = s.readUIntBE(r, 8);
                    break;
                default:
                    e.value = s.readUInt16BE(r), e.convertedValue = !1
            }
    }
    return e
}, de.biancoroyal.modbus.io.core.convertValuesByType = function (e, r, s, a) {
    var t, i = de.biancoroyal.modbus.io.core,
        d = 0;
    for (d in e) {
        var o = e[d];
        if (o && Object.prototype.hasOwnProperty.call(o, "dataType") && Object.prototype.hasOwnProperty.call(o, "registerAddress") && !(o.registerAddress < 0)) {
            if (de.biancoroyal.modbus.io.core.isRegisterSizeWrong(r, o.registerAddress, Number(o.bits))) {
                a && i.internalDebug("Insert Value Register Reached At Address-Start-IO:" + o.registerAddress + " Bits:" + Number(o.bits));
                break
            }
            if (!(s.buffer instanceof Buffer)) {
                a && i.internalDebug("Response Buffer Is Not A Buffer");
                break
            }
            t = 2 * Number(o.registerAddress);
            try {
                o = i.getValueFromBufferByDataType(o, t, s.buffer, a)
            } catch (e) {
                i.internalDebug(e.message)
            }
        } else a && i.internalDebug("Item Not Valid To Convert " + JSON.stringify(o))
    }
    return e
}, de.biancoroyal.modbus.io.core.filterValueNames = function (e, r, s, a, t) {
    if (!r.length || !r.filter) return r;
    var i = de.biancoroyal.modbus.io.core,
        d = "input";
    2 !== s && 4 !== s || (d = "output");
    var o = a,
        u = Number(a) + Number(t) - 1;
    return e.logIOActivities && i.internalDebug("adr:" + a + " quantity:" + t + " startRegister:" + o + " endRegister:" + u + " functionType:" + d), r.filter(function (e) {
        return 0 <= e.registerAddress && e.addressStartIO >= o && e.addressStartIO <= u && e.type === d
    })
}, de.biancoroyal.modbus.io.core.isRegisterSizeWrong = function (e, r, s) {
    s = Number(s) || 16, r = Number(r), s = 16 < s ? r + s / 16 - 1 : r;
    return r < 0 || e.length < r || s > e.length
}, de.biancoroyal.modbus.io.core.buildMessageWithIO = function (e, r, s, a) {
    var t = this.core.getOriginalMessage(e.bufferMessageList, a);
    t.modbusRequest = Object.assign({}, a.payload), t.payload = r, t.topic = a.topic, t.responseBuffer = s;
    var i = Object.assign({}, t);
    if (i.payload = s, i.values = r, delete i.responseBuffer, e.useIOFile && e.ioFile.lastUpdatedAt) {
        s = this.nameValuesFromIOFile(e, a, r, s, parseInt(a.payload.address) || 0), a = this.filterValueNames(e, s, parseInt(a.payload.fc) || 3, parseInt(a.payload.address) || 0, parseInt(a.payload.quantity) || 1, e.logIOActivities);
        return e.useIOForPayload ? (t.payload = a, t.values = r) : (t.payload = r, t.valueNames = a), i.valueNames = a, [t, i]
    }
    return [t, i]
}, module.exports = de.biancoroyal.modbus.io.core;
//# sourceMappingURL=../maps/core/modbus-io-core.js.map