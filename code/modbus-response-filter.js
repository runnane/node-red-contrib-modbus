"use strict";

/**
 Copyright (c) 2017,2018,2019,2020,2021 Klaus Landsdorf (https://bianco-royal.space/)
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

  var mbCore = require('./core/modbus-core');

  var mbBasics = require('./modbus-basics');

  var modbusIOFileValuNames = [];

  function ModbusResponseFilter(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.filter = config.filter;
    this.registers = parseInt(config.registers) || null;
    this.filterResponseBuffer = config.filterResponseBuffer;
    this.filterValues = config.filterValues;
    this.filterInput = config.filterInput;
    this.showStatusActivities = config.showStatusActivities;
    this.showErrors = config.showErrors;
    this.ioFile = RED.nodes.getNode(config.ioFile);
    var node = this;
    modbusIOFileValuNames = node.ioFile.configData;
    mbBasics.setNodeStatusTo('active', node);
    node.ioFile.on('updatedConfig', function (configData) {
      modbusIOFileValuNames = configData;
    });

    node.filterFromPayload = function (msg) {
      msg.payload = msg.payload.filter(function (item) {
        return item.name === node.filter;
      });

      if (node.filterResponseBuffer) {
        delete msg.responseBuffer;
      }

      if (node.filterValues) {
        delete msg.values;
      }

      if (node.filterInput) {
        delete msg.input;
      }

      return msg;
    };

    node.on('input', function (msg) {
      if (mbBasics.invalidPayloadIn(msg)) {
        return;
      }

      if (node.registers && node.registers > 0) {
        if (!msg.payload.length || msg.payload.length !== node.registers) {
          if (node.showErrors) {
            node.error(new Error(msg.payload.length + ' does not match ' + node.registers));
          }

          mbCore.internalDebug(msg.payload.length + ' Registers And Filter Length Of ' + node.registers + ' Does Not Match');
        } else {
          node.send(node.filterFromPayload(msg));
        }
      } else {
        // without register safety
        node.send(node.filterFromPayload(msg));
      }
    });
    node.on('close', function () {
      mbBasics.setNodeStatusTo('closed', node);
    });
  }

  RED.nodes.registerType('modbus-response-filter', ModbusResponseFilter);
  RED.httpAdmin.get('/modbus/iofile/valuenames', RED.auth.needsPermission('iofile.read'), function (req, res) {
    res.json(modbusIOFileValuNames);
  });
};
//# sourceMappingURL=maps/modbus-response-filter.js.map
