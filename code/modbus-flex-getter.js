"use strict";

/**
 Copyright (c) 2016,2017,2018,2019,2020,2021 Klaus Landsdorf (https://bianco-royal.space/)
 All rights reserved.
 node-red-contrib-modbus - The BSD 3-Clause License

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 */

/**
 * Modbus flexible Getter node.
 * @module NodeRedModbusFlexGetter
 *
 * @param RED
 */
module.exports = function (RED) {
  'use strict';

  require('source-map-support').install();

  var mbBasics = require('./modbus-basics');

  var mbCore = require('./core/modbus-core');

  var mbIOCore = require('./core/modbus-io-core');

  var internalDebugLog = require('debug')('contribModbus:flex:getter');

  function ModbusFlexGetter(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.showStatusActivities = config.showStatusActivities;
    this.showErrors = config.showErrors;
    this.connection = null;
    this.useIOFile = config.useIOFile;
    this.ioFile = RED.nodes.getNode(config.ioFile);
    this.useIOForPayload = config.useIOForPayload;
    this.logIOActivities = config.logIOActivities;
    this.emptyMsgOnFail = config.emptyMsgOnFail;
    this.keepMsgProperties = config.keepMsgProperties;
    this.internalDebugLog = internalDebugLog;
    this.verboseLogging = RED.settings.verbose;
    var node = this;
    node.bufferMessageList = new Map();
    mbBasics.setNodeStatusTo('waiting', node);
    var modbusClient = RED.nodes.getNode(config.server);

    if (!modbusClient) {
      return;
    }

    modbusClient.registerForModbus(node);
    mbBasics.initModbusClientEvents(node, modbusClient);

    node.onModbusReadDone = function (resp, msg) {
      if (node.showStatusActivities) {
        mbBasics.setNodeStatusTo('reading done', node);
      }

      node.send(mbIOCore.buildMessageWithIO(node, resp.data, resp, msg));
      node.emit('modbusFlexGetterNodeDone');
    };

    node.errorProtocolMsg = function (err, msg) {
      mbBasics.logMsgError(node, err, msg);
      mbBasics.sendEmptyMsgOnFail(node, err, msg);
    };

    node.onModbusReadError = function (err, msg) {
      node.internalDebugLog(err.message);
      var origMsg = mbCore.getOriginalMessage(node.bufferMessageList, msg);
      node.errorProtocolMsg(err, origMsg);
      mbBasics.setModbusError(node, modbusClient, err, origMsg);
      node.emit('modbusFlexGetterNodeError');
    };

    node.prepareMsg = function (msg) {
      if (typeof msg.payload === 'string') {
        msg.payload = JSON.parse(msg.payload);
      }

      msg.payload.fc = parseInt(msg.payload.fc) || 3;
      msg.payload.unitid = parseInt(msg.payload.unitid);
      msg.payload.address = parseInt(msg.payload.address) || 0;
      msg.payload.quantity = parseInt(msg.payload.quantity) || 1;
      return msg;
    };

    node.isValidModbusMsg = function (msg) {
      var isValid = true;

      if (!(Number.isInteger(msg.payload.fc) && msg.payload.fc >= 1 && msg.payload.fc <= 4)) {
        node.error('FC Not Valid', msg);
        isValid &= false;
      }

      if (isValid && !(Number.isInteger(msg.payload.address) && msg.payload.address >= 0 && msg.payload.address <= 65535)) {
        node.error('Address Not Valid', msg);
        isValid &= false;
      }

      if (isValid && !(Number.isInteger(msg.payload.quantity) && msg.payload.quantity >= 1 && msg.payload.quantity <= 65535)) {
        node.error('Quantity Not Valid', msg);
        isValid &= false;
      }

      return isValid;
    };

    node.buildNewMessageObject = function (node, msg) {
      var messageId = mbCore.getObjectId();
      return {
        topic: msg.topic || node.id,
        messageId: messageId,
        payload: {
          value: msg.payload.value || msg.value,
          unitid: msg.payload.unitid,
          fc: msg.payload.fc,
          address: msg.payload.address,
          quantity: msg.payload.quantity,
          emptyMsgOnFail: node.emptyMsgOnFail,
          keepMsgProperties: node.keepMsgProperties,
          messageId: messageId
        }
      };
    };

    node.on('input', function (msg) {
      if (mbBasics.invalidPayloadIn(msg) || !modbusClient.client) {
        return;
      }

      var origMsgInput = Object.assign({}, msg); // keep it origin

      try {
        var inputMsg = node.prepareMsg(origMsgInput);

        if (node.isValidModbusMsg(inputMsg)) {
          var newMsg = node.buildNewMessageObject(node, inputMsg);
          node.bufferMessageList.set(newMsg.messageId, mbBasics.buildNewMessage(node.keepMsgProperties, inputMsg, newMsg));
          modbusClient.emit('readModbus', newMsg, node.onModbusReadDone, node.onModbusReadError);
        }
      } catch (err) {
        node.errorProtocolMsg(err, origMsgInput);
      }

      if (node.showStatusActivities) {
        mbBasics.setNodeStatusTo(modbusClient.actualServiceState, node);
      }
    });
    node.on('close', function (done) {
      mbBasics.setNodeStatusTo('closed', node);
      node.bufferMessageList.clear();
      modbusClient.deregisterForModbus(node.id, done);
    });

    if (!node.showStatusActivities) {
      mbBasics.setNodeDefaultStatus(node);
    }
  }

  RED.nodes.registerType('modbus-flex-getter', ModbusFlexGetter);
};
//# sourceMappingURL=maps/modbus-flex-getter.js.map
