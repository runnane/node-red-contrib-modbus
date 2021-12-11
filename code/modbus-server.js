"use strict";

/**
 Copyright (c) 2016,2017,2018,2019,2020,2021 Klaus Landsdorf (https://bianco-royal.space/)
 All rights reserved.
 node-red-contrib-modbus - The BSD 3-Clause License

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 **/

/**
 * Modbus Server node.
 * @module NodeRedModbusServer
 *
 * @param RED
 */
module.exports = function (RED) {
  'use strict';

  require('source-map-support').install();

  var modbus = require('jsmodbus');

  var net = require('net');

  var coreServer = require('./core/modbus-server-core');

  var mbBasics = require('./modbus-basics');

  var internalDebugLog = require('debug')('contribModbus:server');

  function ModbusServer(config) {
    RED.nodes.createNode(this, config);
    var bufferFactor = 8;
    this.name = config.name;
    this.logEnabled = config.logEnabled;
    this.hostname = config.hostname || '0.0.0.0';
    this.serverPort = parseInt(config.serverPort);
    this.responseDelay = parseInt(config.responseDelay) || 1;
    this.delayUnit = config.delayUnit;
    this.coilsBufferSize = parseInt(config.coilsBufferSize * bufferFactor);
    this.holdingBufferSize = parseInt(config.holdingBufferSize * bufferFactor);
    this.inputBufferSize = parseInt(config.inputBufferSize * bufferFactor);
    this.discreteBufferSize = parseInt(config.discreteBufferSize * bufferFactor);
    this.showErrors = config.showErrors;
    this.internalDebugLog = internalDebugLog;
    this.verboseLogging = RED.settings.verbose;
    var node = this;
    node.netServer = null;
    node.modbusServer = null;
    mbBasics.setNodeStatusTo('initialized', node);
    var modbusLogLevel = 'warn';

    if (RED.settings.verbose) {
      modbusLogLevel = 'debug';
    }

    try {
      node.netServer = new net.Server();
      node.modbusServer = new modbus.server.TCP(node.netServer, {
        logLabel: 'ModbusServer',
        logLevel: modbusLogLevel,
        logEnabled: node.logEnabled,
        responseDelay: mbBasics.calc_rateByUnit(node.responseDelay, node.delayUnit),
        coils: Buffer.alloc(node.coilsBufferSize, 0),
        holding: Buffer.alloc(node.holdingBufferSize, 0),
        input: Buffer.alloc(node.inputBufferSize, 0),
        discrete: Buffer.alloc(node.discreteBufferSize, 0)
      });
      node.modbusServer.on('connection', function (client) {
        internalDebugLog('Modbus Server client connection');

        if (client && client.socket) {
          internalDebugLog('Modbus Server client to ' + JSON.stringify(client.socket.address()) + ' from ' + client.socket.remoteAddress + ' ' + client.socket.remotePort);
        }

        mbBasics.setNodeStatusTo('active', node);
      });
      node.netServer.listen(node.serverPort, node.hostname, function () {
        internalDebugLog('Modbus Server listening on modbus://' + node.hostname + ':' + node.serverPort);
        mbBasics.setNodeStatusTo('initialized', node);
      });

      if (!node.showStatusActivities) {
        mbBasics.setNodeDefaultStatus(node);
      }
    } catch (err) {
      internalDebugLog(err.message);

      if (node.showErrors) {
        node.warn(err);
      }

      mbBasics.setNodeStatusTo('error', node);
    }

    node.on('input', function (msg) {
      if (coreServer.isValidMemoryMessage(msg)) {
        coreServer.writeToServerMemory(node, msg);

        if (!msg.payload.disableMsgOutput) {
          node.send(buildMessage(msg));
        }
      } else {
        if (node.showErrors) {
          node.error('Is Not A Valid Memory Write Message To Server', msg);
        }

        if (!msg.payload.disableMsgOutput) {
          node.send(buildMessage(msg));
        }
      }
    });

    function buildMessage(msg) {
      return [{
        type: 'holding',
        message: msg,
        payload: node.modbusServer.holding
      }, {
        type: 'coils',
        message: msg,
        payload: node.modbusServer.coils
      }, {
        type: 'input',
        message: msg,
        payload: node.modbusServer.input
      }, {
        type: 'discrete',
        message: msg,
        payload: node.modbusServer.discrete
      }, {
        payload: 'request',
        type: 'message',
        message: msg
      }];
    }

    node.on('close', function (done) {
      mbBasics.setNodeStatusTo('closed', node);

      if (node.netServer) {
        node.netServer.close(function () {
          internalDebugLog('Modbus Server closed');
          done();
        });
      }

      node.modbusServer = null;
    });
  }

  try {
    RED.nodes.registerType('modbus-server', ModbusServer);
  } catch (err) {
    internalDebugLog(err.message);
  }
};
//# sourceMappingURL=maps/modbus-server.js.map
