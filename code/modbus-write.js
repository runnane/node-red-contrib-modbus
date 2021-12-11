"use strict";

/**
 Copyright (c) 2016,2017,2018,2019,2020,2021 Klaus Landsdorf (https://bianco-royal.space/)
 Copyright 2016 - Jason D. Harper, Argonne National Laboratory
 Copyright 2015,2016 - Mika Karaila, Valmet Automation Inc.
 All rights reserved.
 node-red-contrib-modbus

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 **/

/**
 * Modbus Write node.
 * @module NodeRedModbusWrite
 *
 * @param RED
 */
module.exports = function (RED) {
  'use strict';

  require('source-map-support').install();

  var mbBasics = require('./modbus-basics');

  var mbCore = require('./core/modbus-core');

  var internalDebugLog = require('debug')('contribModbus:write');

  function ModbusWrite(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.showStatusActivities = config.showStatusActivities;
    this.showErrors = config.showErrors;
    this.unitid = config.unitid;
    this.dataType = config.dataType;
    this.adr = Number(config.adr);
    this.quantity = config.quantity;
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

    node.onModbusWriteDone = function (resp, msg) {
      if (node.showStatusActivities) {
        mbBasics.setNodeStatusTo('write done', node);
      }

      node.send(mbCore.buildMessage(node.bufferMessageList, msg.payload, resp, msg));
      node.emit('modbusWriteNodeDone');
    };

    node.errorProtocolMsg = function (err, msg) {
      mbBasics.logMsgError(node, err, msg);
      mbBasics.sendEmptyMsgOnFail(node, err, msg);
    };

    node.onModbusWriteError = function (err, msg) {
      node.internalDebugLog(err.message);
      var origMsg = mbCore.getOriginalMessage(node.bufferMessageList, msg);
      node.errorProtocolMsg(err, origMsg);
      mbBasics.setModbusError(node, modbusClient, err, origMsg);
      node.emit('modbusWriteNodeError');
    };

    node.setMsgPayloadFromHTTPRequests = function (msg) {
      /* HTTP requests for boolean and multiple data string [1,2,3,4,5] */
      if (Object.prototype.hasOwnProperty.call(msg.payload, 'value') && typeof msg.payload.value === 'string') {
        if (msg.payload.value === 'true' || msg.payload.value === 'false') {
          msg.payload.value = msg.payload.value === 'true';
        } else {
          if (msg.payload.value.indexOf(',') > -1) {
            msg.payload.value = JSON.parse(msg.payload.value);
          }
        }
      }

      return msg;
    };

    node.buildNewMessageObject = function (node, msg) {
      var messageId = mbCore.getObjectId();
      return {
        topic: msg.topic || node.id,
        messageId: messageId,
        payload: {
          value: Object.prototype.hasOwnProperty.call(msg.payload, 'value') ? msg.payload.value : msg.payload,
          unitid: node.unitid,
          fc: mbCore.functionCodeModbusWrite(node.dataType),
          address: node.adr,
          quantity: node.quantity,
          messageId: messageId
        }
      };
    };

    node.on('input', function (msg) {
      var origMsgInput = Object.assign({}, msg);

      if (mbBasics.invalidPayloadIn(msg)) {
        return;
      }

      if (!modbusClient.client) {
        return;
      }

      try {
        var httpMsg = node.setMsgPayloadFromHTTPRequests(origMsgInput);
        var newMsg = node.buildNewMessageObject(node, httpMsg);
        node.bufferMessageList.set(newMsg.messageId, mbBasics.buildNewMessage(node.keepMsgProperties, httpMsg, newMsg));
        modbusClient.emit('writeModbus', newMsg, node.onModbusWriteDone, node.onModbusWriteError);

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

  RED.nodes.registerType('modbus-write', ModbusWrite);
};
//# sourceMappingURL=maps/modbus-write.js.map
