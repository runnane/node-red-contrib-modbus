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
      queue: {
        core: {}
      }
    }
  }
}; // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.queue.core.internalDebug = de.biancoroyal.modbus.queue.core.internalDebug || require('debug')('contribModbus:queue:core'); // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.queue.core.core = de.biancoroyal.modbus.queue.core.core || require('./modbus-core'); // eslint-disable-line no-use-before-define

de.biancoroyal.modbus.queue.core.initQueue = function (node) {
  node.bufferCommandList.clear();
  node.sendingAllowed.clear();
  node.unitSendingAllowed = [];

  for (var step = 0; step <= 255; step++) {
    node.bufferCommandList.set(step, []);
    node.sendingAllowed.set(step, true);
  }
};

de.biancoroyal.modbus.queue.core.checkQueuesAreEmpty = function (node) {
  var queuesAreEmpty = true;

  for (var step = 0; step <= 255; step++) {
    queuesAreEmpty &= node.bufferCommandList.get(step).length === 0;
  }

  return queuesAreEmpty;
};

de.biancoroyal.modbus.queue.core.queueSerialUnlockCommand = function (node) {
  this.internalDebug('queue serial unlock command node ' + node.name);
  node.serialSendingAllowed = true;
};

de.biancoroyal.modbus.queue.core.queueSerialLockCommand = function (node) {
  this.internalDebug('queue serial lock command node ' + node.name);
  node.serialSendingAllowed = false;
};

de.biancoroyal.modbus.queue.core.sequentialDequeueCommand = function (node) {
  this.internalDebug('sequential de-queue command');
  return new Promise(function (resolve, reject) {
    var queueCore = de.biancoroyal.modbus.queue.core;

    if (node.parallelUnitIdsAllowed) {
      for (var unitId = 0; unitId < 256; unitId += 1) {
        queueCore.sendQueueDataToModbus(node, unitId);
      }
    } else {
      var _unitId = node.unitSendingAllowed.shift();

      if (!_unitId) {
        reject(new Error('UnitId is valid from sending allowed list'));
        return;
      }

      node.queueLog(JSON.stringify({
        type: 'sequential dequeue command',
        unitId: _unitId,
        isValidUnitId: queueCore.isValidUnitId(_unitId),
        sendingAllowed: node.sendingAllowed.get(_unitId),
        serialSendingAllowed: node.serialSendingAllowed
      }));

      if (queueCore.isValidUnitId(_unitId) && node.sendingAllowed.get(_unitId)) {
        queueCore.sendQueueDataToModbus(node, _unitId);
      } else {
        node.warn('sequential dequeue command not possible for Unit ' + _unitId);
        var infoText = 'sending is allowed for Unit ';

        if (node.sendingAllowed.get(_unitId)) {
          node.warn(infoText + _unitId);
        } else {
          node.warn('no ' + infoText + _unitId);
        }

        infoText = 'valid  Unit ';

        if (queueCore.isValidUnitId(_unitId)) {
          node.warn(infoText + _unitId);
        } else {
          node.warn('no ' + infoText + _unitId);
        }

        infoText = ' serial sending allowed for Unit ';

        if (node.serialSendingAllowed) {
          node.warn(node.name + infoText + _unitId);
        } else {
          node.warn(node.name + ' no' + infoText + _unitId);
        }
      }
    }

    resolve();
  });
};

de.biancoroyal.modbus.queue.core.sendQueueDataToModbus = function (node, unitId) {
  var queueLength = node.bufferCommandList.get(unitId).length;
  node.queueLog(JSON.stringify({
    type: 'send queue data to Modbus',
    unitId: unitId,
    queueLength: queueLength,
    sendingAllowed: node.sendingAllowed.get(unitId),
    serialSendingAllowed: node.serialSendingAllowed
  }));

  if (queueLength) {
    var command = node.bufferCommandList.get(unitId).shift();

    if (command) {
      node.sendingAllowed.set(unitId, false);
      command.callModbus(node, command.msg, command.cb, command.cberr);
    } else {
      throw new Error('Command On Send Not Valid');
    }
  }
};

de.biancoroyal.modbus.queue.core.dequeueLogEntry = function (node, state, info) {
  node.queueLog(JSON.stringify({
    state: state.value,
    message: "".concat(info, " ").concat(node.clienttype),
    delay: node.commandDelay
  }));
};

de.biancoroyal.modbus.queue.core.dequeueCommand = function (node) {
  var queueCore = de.biancoroyal.modbus.queue.core;
  var state = node.actualServiceState;

  if (node.messageAllowedStates.indexOf(state.value) === -1) {
    queueCore.dequeueLogEntry(node, state, 'dequeue command disallowed state');
  } else {
    queueCore.sequentialDequeueCommand(node).then(function () {
      queueCore.dequeueLogEntry(node, state, 'dequeue command done');
    })["catch"](function (err) {
      queueCore.dequeueLogEntry(node, state, 'dequeue command error ' + err.message);
    });
  }
};

de.biancoroyal.modbus.queue.core.getUnitIdToQueue = function (node, msg) {
  return parseInt(msg.payload.unitid) || parseInt(node.unit_id) || 0;
};

de.biancoroyal.modbus.queue.core.isValidUnitId = function (unitId) {
  return unitId >= 0 || unitId <= 255;
};

de.biancoroyal.modbus.queue.core.getQueueLengthByUnitId = function (node, unitId) {
  if (this.isValidUnitId(unitId)) {
    return node.bufferCommandList.get(unitId).length;
  } else {
    throw new Error('(0-255) Got A Wrong Unit-Id: ' + unitId);
  }
};

de.biancoroyal.modbus.queue.core.pushToQueueByUnitId = function (node, callModbus, msg, cb, cberr) {
  var coreQueue = de.biancoroyal.modbus.queue.core;
  return new Promise(function (resolve, reject) {
    try {
      var unitId = coreQueue.getUnitIdToQueue(node, msg);

      if (!unitId) {
        reject(new Error('UnitId is valid from msg or node'));
        return;
      }

      var queueLength = coreQueue.getQueueLengthByUnitId(node, unitId);
      msg.queueLengthByUnitId = {
        unitId: unitId,
        queueLength: queueLength
      };
      msg.queueUnitId = unitId;

      if (!node.parallelUnitIdsAllowed || node.clienttype === 'serial') {
        node.unitSendingAllowed.push(unitId);
      }

      node.bufferCommandList.get(unitId).push({
        callModbus: callModbus,
        msg: msg,
        cb: cb,
        cberr: cberr
      });
      node.queueLog(JSON.stringify({
        info: 'pushed to Queue by Unit-Id',
        message: msg.payload,
        unitId: unitId
      }));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = de.biancoroyal.modbus.queue.core;
//# sourceMappingURL=../maps/core/modbus-queue-core.js.map
