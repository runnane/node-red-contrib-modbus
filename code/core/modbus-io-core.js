/**
 Copyright (c) 2016,2017,2018,2019,2020,2021 Klaus Landsdorf (https://bianco-royal.space/)
 All rights reserved.
 node-red-contrib-modbus
 node-red-contrib-modbusio

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 */
'use strict';

require('source-map-support').install(); // eslint-disable-next-line no-var


var de = de || {
  biancoroyal: {
    modbus: {
      io: {
        core: {}
      }
    }
  }
}; // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.io.core.internalDebug = de.biancoroyal.modbus.io.core.internalDebug || require('debug')('contribModbus:io:core'); // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.io.core.LineByLineReader = de.biancoroyal.modbus.io.core.LineByLineReader || require('line-by-line'); // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.io.core.core = de.biancoroyal.modbus.io.core.core || require('./modbus-core'); // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.io.core.nameValuesFromIOFile = function (node, msg, values, response, readingOffset) {
  var valueNames = [];
  var ioCore = de.biancoroyal.modbus.io.core;

  if (node.ioFile && node.ioFile.configData) {
    node.ioFile.configData.forEach(function (mapping) {
      if (mapping.valueAddress && mapping.valueAddress.startsWith('%I')) {
        valueNames.push(ioCore.buildInputAddressMapping('MB-INPUTS', mapping, Number(node.ioFile.addressOffset), Number(readingOffset), node.logIOActivities));
      }

      if (mapping.valueAddress && mapping.valueAddress.startsWith('%Q')) {
        valueNames.push(ioCore.buildOutputAddressMapping('MB-OUTPUTS', mapping, Number(node.ioFile.addressOffset), Number(readingOffset), node.logIOActivities));
      }
    });
  }

  valueNames = ioCore.insertValues(valueNames, values, node.logIOActivities);
  return ioCore.convertValuesByType(valueNames, values, response, node.logIOActivities);
};

de.biancoroyal.modbus.io.core.allValueNamesFromIOFile = function (ioNode) {
  var valueNames = [];
  var ioCore = de.biancoroyal.modbus.io.core;

  if (ioNode && ioNode.configData) {
    ioNode.configData.forEach(function (mapping) {
      if (mapping.valueAddress && mapping.valueAddress.startsWith('%I')) {
        valueNames.push(ioCore.buildInputAddressMapping('MB-INPUTS', mapping, Number(ioNode.addressOffset), 0));
      }

      if (mapping.valueAddress && mapping.valueAddress.startsWith('%Q')) {
        valueNames.push(ioCore.buildOutputAddressMapping('MB-OUTPUTS', mapping, Number(ioNode.addressOffset), 0));
      }
    });
  }

  return valueNames;
};

de.biancoroyal.modbus.io.core.getDataTypeFromFirstCharType = function (type) {
  switch (type) {
    case 'w':
      return 'Word';

    case 'd':
      return 'Double';

    case 'r':
      return 'Real';

    case 'f':
      return 'Float';

    case 'i':
      return 'Integer';

    case 'l':
      return 'Long';

    case 'b':
      return 'Boolean';

    default:
      return 'Unsigned Integer';
  }
};

de.biancoroyal.modbus.io.core.buildInputAddressMapping = function (registerName, mapping, offset, readingOffset, logging) {
  var ioCore = de.biancoroyal.modbus.io.core;
  var addressStart = 0;
  var coilStart = 0;
  var addressOffset = 0;
  var bits = 0;
  var bitAddress = null;
  var type = mapping.name.substring(0, 1);
  var registerType = mapping.valueAddress.substring(2, 3);
  var addressType = mapping.valueAddress.substring(0, 3);

  switch (type) {
    case 'w': // word

    case 'u':
      // unsigned integer
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 1;
      bits = 16;
      break;

    case 'i':
      // integer
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);

      if (registerType === 'W') {
        addressOffset = 1;
        bits = 16;
      } else {
        addressOffset = 2;
        bits = 32;
      }

      break;

    case 'r': // real

    case 'f':
      // float
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 2;
      bits = 32;
      break;

    case 'd':
      // double
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 4;
      bits = 64;
      break;

    case 'l':
      // long
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 5;
      bits = 80;
      break;

    case 'b':
      // bit - boolean
      if (registerType === 'X') {
        bitAddress = mapping.valueAddress.split('%IX')[1].split('.');
        addressStart = Math.floor(Number(bitAddress[0]) / 2);
        coilStart = Number(bitAddress[0]) * 8 + Number(bitAddress[1]);
        addressOffset = 1;
        bits = 1;
      }

      break;

    default:
      if (logging) {
        ioCore.internalDebug('unknown input type ' + type);
      }

      bits = 0;
  }

  if (bits) {
    var addressStartIO = addressStart - (Number(offset) || 0);
    return {
      register: registerName,
      name: mapping.name,
      addressStart: addressStart,
      addressOffset: addressOffset,
      addressOffsetIO: Number(offset) || 0,
      addressStartIO: addressStartIO,
      registerAddress: addressStartIO - Number(readingOffset),
      coilStart: coilStart,
      bitAddress: bitAddress,
      Bit: bitAddress ? Number(bitAddress[0]) * 8 + Number(bitAddress[1]) : 0,
      bits: bits,
      dataType: ioCore.getDataTypeFromFirstCharType(type),
      type: 'input'
    };
  }

  return {
    name: mapping.name,
    type: type,
    mapping: mapping,
    error: 'variable name does not match input mapping'
  };
};

de.biancoroyal.modbus.io.core.buildOutputAddressMapping = function (registerName, mapping, offset, readingOffset, logging) {
  var ioCore = de.biancoroyal.modbus.io.core;
  var addressStart = 0;
  var coilStart = 0;
  var addressOffset = 0;
  var bits = 0;
  var bitAddress = null;
  var type = mapping.name.substring(0, 1);
  var registerType = mapping.valueAddress.substring(2, 3);
  var addressType = mapping.valueAddress.substring(0, 3);

  switch (type) {
    case 'w': // word

    case 'u':
      // unsigned integer
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 1;
      bits = 16;
      break;

    case 'i':
      // integer
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);

      if (registerType === 'W') {
        addressOffset = 1;
        bits = 16;
      } else {
        addressOffset = 2;
        bits = 32;
      }

      break;

    case 'r': // real

    case 'f':
      // float
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 2;
      bits = 32;
      break;

    case 'd':
      // double
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 4;
      bits = 64;
      break;

    case 'l':
      // long
      addressStart = Number(mapping.valueAddress.split(addressType)[1]);
      addressOffset = 5;
      bits = 80;
      break;

    case 'b':
      // bit - boolean
      if (registerType === 'X') {
        bitAddress = mapping.valueAddress.split('%QX')[1].split('.');
        addressStart = Math.floor(Number(bitAddress[0]) / 2);
        coilStart = Number(bitAddress[0]) * 8 + Number(bitAddress[1]);
        addressOffset = 1;
        bits = 1;
      }

      break;

    default:
      if (logging) {
        ioCore.internalDebug('unknown output type ' + type);
      }

      bits = 0;
  }

  if (bits) {
    var addressStartIO = addressStart - (Number(offset) || 0);
    return {
      register: registerName,
      name: mapping.name,
      addressStart: addressStart,
      addressOffset: addressOffset,
      addressOffsetIO: Number(offset) || 0,
      addressStartIO: addressStartIO,
      registerAddress: addressStartIO - Number(readingOffset),
      coilStart: coilStart,
      bitAddress: bitAddress,
      Bit: bitAddress ? Number(bitAddress[0]) * 8 + Number(bitAddress[1]) : 0,
      bits: bits,
      dataType: ioCore.getDataTypeFromFirstCharType(type),
      type: 'output'
    };
  }

  return {
    name: mapping.name,
    type: type,
    mapping: mapping,
    error: 'variable name does not match output mapping'
  };
};

de.biancoroyal.modbus.io.core.insertValues = function (valueNames, register, logging) {
  var ioCore = de.biancoroyal.modbus.io.core;
  var index = 0;

  for (index in valueNames) {
    var item = valueNames[index];

    if (!item || !Object.prototype.hasOwnProperty.call(item, 'registerAddress') || item.registerAddress < 0) {
      if (logging) {
        ioCore.internalDebug('Item Not Valid To Insert Value ' + JSON.stringify(item));
      }

      continue;
    }

    if (de.biancoroyal.modbus.io.core.isRegisterSizeWrong(register, item.registerAddress, Number(item.bits))) {
      if (logging) {
        ioCore.internalDebug('Insert Value Register Reached At Address-Start-IO:' + item.registerAddress + ' Bits:' + Number(item.bits));
      }

      break;
    }

    switch (Number(item.bits)) {
      case 1:
        item.value = !!(register[item.registerAddress] & Math.pow(item.bitAddress[1], 2));
        break;

      case 16:
        item.value = register[item.registerAddress];
        break;

      case 32:
        item.value = register[item.registerAddress + 1] << 16 | register[item.registerAddress];
        break;

      case 64:
        item.value = register[item.registerAddress + 3] << 48 | register[item.registerAddress + 2] << 32 | register[item.registerAddress + 1] << 16 | register[item.registerAddress];
        break;

      case 80:
        item.value = register[item.registerAddress + 4] << 64 | register[item.registerAddress + 3] << 48 | register[item.registerAddress + 2] << 32 | register[item.registerAddress + 1] << 16 | register[item.registerAddress];
        break;

      default:
        item.value = null;
        break;
    }
  }

  return valueNames;
};

de.biancoroyal.modbus.io.core.getValueFromBufferByDataType = function (item, bufferOffset, responseBuffer, logging) {
  var ioCore = de.biancoroyal.modbus.io.core;
  var registerLength = responseBuffer.length / 2;

  if (bufferOffset < 0 || bufferOffset > responseBuffer.length) {
    if (logging) {
      ioCore.internalDebug('Wrong Buffer Access Parameter Type:' + item.dataType + ' Register-Length: ' + registerLength + ' Buffer-Length:' + responseBuffer.length + ' Address-Buffer-Offset:' + bufferOffset);
      ioCore.internalDebug(JSON.stringify(item));
    }

    return item;
  }

  if (logging) {
    ioCore.internalDebug('Get Value From Buffer By Data Type:' + item.dataType + ' Register:' + item.registerAddress + ' Bits:' + Number(item.bits));
  }

  switch (item.dataType) {
    case 'Boolean':
      item.value = !!(responseBuffer.readUInt16BE(bufferOffset) & Math.pow(item.bitAddress[1], 2));
      break;

    case 'Word':
      switch (item.bits) {
        case '8':
          item.value = responseBuffer.readInt8(bufferOffset);
          break;

        default:
          item.value = responseBuffer.readInt16BE(bufferOffset); // DWord

          item.convertedValue = false;
      }

      break;

    case 'Integer':
      switch (item.bits) {
        case '8':
          item.value = responseBuffer.readInt8(bufferOffset);
          break;

        case '32':
          item.value = responseBuffer.readInt32BE(bufferOffset);
          break;

        case '64':
          item.value = responseBuffer.readIntBE(bufferOffset, 8);
          break;

        default:
          item.value = responseBuffer.readInt16BE(bufferOffset);
      }

      break;

    case 'Real':
    case 'Float':
      item.value = responseBuffer.readFloatBE(bufferOffset, 4);
      break;

    case 'Double':
      item.value = responseBuffer.readDoubleBE(bufferOffset, 8);
      break;

    case 'Long':
      item.value = responseBuffer.readDoubleBE(bufferOffset, 10);
      break;

    default:
      switch (item.bits) {
        case '8':
          item.value = responseBuffer.readUInt8(bufferOffset);
          break;

        case '32':
          item.value = responseBuffer.readUInt32BE(bufferOffset);
          break;

        case '64':
          item.value = responseBuffer.readUIntBE(bufferOffset, 8);
          break;

        default:
          item.value = responseBuffer.readUInt16BE(bufferOffset);
          item.convertedValue = false;
      }

      break;
  }

  return item;
};

de.biancoroyal.modbus.io.core.convertValuesByType = function (valueNames, register, responseBuffer, logging) {
  var ioCore = de.biancoroyal.modbus.io.core;
  var bufferOffset = 0;
  var sixteenBitBufferLength = 2;
  var index = 0;

  for (index in valueNames) {
    var item = valueNames[index];

    if (!item || !Object.prototype.hasOwnProperty.call(item, 'dataType') || !Object.prototype.hasOwnProperty.call(item, 'registerAddress') || item.registerAddress < 0) {
      if (logging) {
        ioCore.internalDebug('Item Not Valid To Convert ' + JSON.stringify(item));
      }

      continue;
    }

    if (de.biancoroyal.modbus.io.core.isRegisterSizeWrong(register, item.registerAddress, Number(item.bits))) {
      if (logging) {
        ioCore.internalDebug('Insert Value Register Reached At Address-Start-IO:' + item.registerAddress + ' Bits:' + Number(item.bits));
      }

      break;
    }

    if (responseBuffer.buffer instanceof Buffer) {
      bufferOffset = Number(item.registerAddress) * sixteenBitBufferLength;

      try {
        item = ioCore.getValueFromBufferByDataType(item, bufferOffset, responseBuffer.buffer, logging);
      } catch (err) {
        ioCore.internalDebug(err.message);
      }
    } else {
      if (logging) {
        ioCore.internalDebug('Response Buffer Is Not A Buffer');
      }

      break;
    }
  }

  return valueNames;
};

de.biancoroyal.modbus.io.core.filterValueNames = function (node, valueNames, fc, adr, quantity) {
  if (!valueNames.length || !valueNames.filter) {
    return valueNames;
  }

  var ioCore = de.biancoroyal.modbus.io.core;
  var functionType = 'input';

  if (fc === 2 || fc === 4) {
    functionType = 'output';
  }

  var startRegister = adr;
  var endRegister = Number(adr) + Number(quantity) - 1;

  if (node.logIOActivities) {
    ioCore.internalDebug('adr:' + adr + ' quantity:' + quantity + ' startRegister:' + startRegister + ' endRegister:' + endRegister + ' functionType:' + functionType);
  }

  return valueNames.filter(function (valueName) {
    return valueName.registerAddress >= 0 && valueName.addressStartIO >= startRegister && valueName.addressStartIO <= endRegister && valueName.type === functionType;
  });
};

de.biancoroyal.modbus.io.core.isRegisterSizeWrong = function (register, start, bits) {
  var sizeDivisor = Number(bits) || 16;
  var startRegister = Number(start);
  var endRegister = startRegister;

  if (sizeDivisor > 16) {
    endRegister = startRegister + sizeDivisor / 16 - 1;
  }

  return startRegister < 0 || register.length < startRegister || endRegister > register.length;
};

de.biancoroyal.modbus.io.core.buildMessageWithIO = function (node, values, response, msg) {
  var origMsg = this.core.getOriginalMessage(node.bufferMessageList, msg);
  origMsg.modbusRequest = Object.assign({}, msg.payload);
  origMsg.payload = values;
  origMsg.topic = msg.topic;
  origMsg.responseBuffer = response;
  var rawMsg = Object.assign({}, origMsg);
  rawMsg.payload = response;
  rawMsg.values = values;
  delete rawMsg.responseBuffer;

  if (node.useIOFile && node.ioFile.lastUpdatedAt) {
    var allValueNames = this.nameValuesFromIOFile(node, msg, values, response, parseInt(msg.payload.address) || 0);
    var valueNames = this.filterValueNames(node, allValueNames, parseInt(msg.payload.fc) || 3, parseInt(msg.payload.address) || 0, parseInt(msg.payload.quantity) || 1, node.logIOActivities);

    if (node.useIOForPayload) {
      origMsg.payload = valueNames;
      origMsg.values = values;
    } else {
      origMsg.payload = values;
      origMsg.valueNames = valueNames;
    }

    rawMsg.valueNames = valueNames;
    return [origMsg, rawMsg];
  } else {
    return [origMsg, rawMsg];
  }
};

module.exports = de.biancoroyal.modbus.io.core;
//# sourceMappingURL=../maps/core/modbus-io-core.js.map
