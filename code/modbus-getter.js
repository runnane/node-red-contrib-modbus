"use strict";

/**
 Copyright (c) 2016,2017,2018,2019,2020,2021 Klaus Landsdorf (https://bianco-royal.space/)
 All rights reserved.
 node-red-contrib-modbus - The BSD 3-Clause License

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 */

/**
 * Modbus Getter node.
 * @module NodeRedModbusGetter
 *
 * @param RED
 */
module.exports = function (RED) {
  'use strict';

  require('source-map-support').install();

  var mbBasics = require('./modbus-basics');

  var mbCore = require('./core/modbus-core');

  var mbIOCore = require('./core/modbus-io-core');

  var internalDebugLog = require('debug')('contribModbus:getter');

  function ModbusGetter(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.unitid = config.unitid;
    this.dataType = config.dataType;
    this.adr = config.adr;
    this.quantity = config.quantity;
    this.showStatusActivities = config.showStatusActivities;
    this.showErrors = config.showErrors;
    this.msgThruput = config.msgThruput;
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

    node.onModbusCommandDone = function (resp, msg) {
      if (node.showStatusActivities) {
        mbBasics.setNodeStatusTo('reading done', node);
      }

      node.send(mbIOCore.buildMessageWithIO(node, resp.data, resp, msg));
      node.emit('modbusGetterNodeDone');
    };

    node.errorProtocolMsg = function (err, msg) {
      mbBasics.logMsgError(node, err, msg);
      mbBasics.sendEmptyMsgOnFail(node, err, msg);
    };

    node.onModbusCommandError = function (err, msg) {
      node.internalDebugLog(err.message);
      var origMsg = mbCore.getOriginalMessage(node.bufferMessageList, msg);
      node.errorProtocolMsg(err, origMsg);
      mbBasics.setModbusError(node, modbusClient, err, origMsg);
      node.emit('modbusGetterNodeError');
    };

    node.buildNewMessageObject = function (node, msg) {
      var messageId = mbCore.getObjectId();
      return {
        topic: msg.topic || node.id,
        messageId: messageId,
        payload: {
          value: msg.payload.value || msg.payload,
          unitid: node.unitid,
          fc: mbCore.functionCodeModbusRead(node.dataType),
          address: node.adr,
          quantity: node.quantity,
          messageId: messageId
        }
      };
    };

    node.on('input', function (msg) {
      if (mbBasics.invalidPayloadIn(msg)) {
        return;
      }

      if (!modbusClient.client) {
        return;
      }

      var origMsgInput = Object.assign({}, msg); // keep it origin

      try {
        var newMsg = node.buildNewMessageObject(node, origMsgInput);
        node.bufferMessageList.set(newMsg.messageId, mbBasics.buildNewMessage(node.keepMsgProperties, origMsgInput, newMsg));
        modbusClient.emit('readModbus', newMsg, node.onModbusCommandDone, node.onModbusCommandError);

        if (node.showStatusActivities) {
          mbBasics.setNodeStatusTo(modbusClient.actualServiceState, node);
        }
      } catch (err) {
        node.errorProtocolMsg(err, origMsgInput);
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

  RED.nodes.registerType('modbus-getter', ModbusGetter);
};
//# sourceMappingURL=maps/modbus-getter.js.map
