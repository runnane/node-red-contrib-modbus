/**
 * Original Work Copyright 2014 IBM Corp.
 * node-red
 *
 * Copyright (c) since the year 2016 Klaus Landsdorf (http://plus4nodered.com/)
 * All rights reserved.
 * node-red-contrib-modbus - The BSD 3-Clause License
 *
 **/

'use strict'

const injectNode = require('@node-red/nodes/core/common/20-inject.js')
const serverNode = require('../../src/modbus-server.js')

const testServerNodes = [injectNode, serverNode]

const helper = require('node-red-node-test-helper')
helper.init(require.resolve('node-red'))
const sinon = require('sinon')
const testFlows = require('./flows/modbus-server-flows.js')
const assert = require('assert')
const internalDebugLog = require('debug')('contribModbus:server')

describe('Server node Testing', function () {
  before(function (done) {
    helper.startServer(function () {
      done()
    })
  })

  afterEach(function (done) {
    helper.unload().then(function () {
      done()
    }).catch(function () {
      done()
    })
  })

  after(function (done) {
    helper.stopServer(function () {
      done()
    })
  })

  describe('Node', function () {
    it('simple Node should be loaded', function (done) {
      helper.load(testServerNodes, testFlows.testSimpleNodeShouldBeLoadedFlow, function () {
        const modbusServer = helper.getNode('178284ea.5055ab')
        modbusServer.should.have.property('name', 'modbusServer')

        done()
      }, function () {
        helper.log('function callback')
      })
    })

    it('simple Node with wrong IP should be loaded', function (done) {
      helper.load(testServerNodes, testFlows.testSimpleNodeWithWrongIPShouldBeLoadedFlow, function () {
        const modbusServer = helper.getNode('178284ea.5055ab')
        modbusServer.should.have.property('name', 'modbusServer')

        done()
      }, function () {
        helper.log('function callback')
      })
    })

    it('should send data on input', function (done) {
      helper.load(testServerNodes, testFlows.testShouldSendDataOnInputFlow, function () {
        const h1 = helper.getNode('h1')
        h1.on('input', function (msg) {
          done()
        })
      }, function () {
        helper.log('function callback')
      })
    })
    // it('should handle errors during server initialization', function (done) {
    //   helper.load(testServerNodes, testFlows.testSimpleNodeShouldBeLoadedFlow, function () {
    //     const modbusServer = helper.getNode('178284ea.5055ab')
    //     modbusServer.warn = sinon.spy();
    //     modbusServer.netServer = null
    //     modbusServer.modbusServer = null
    //     modbusServer.showErrors = true
    //     modbusServer.netServer = null;
    //     const internalDebugLog = sinon.spy();

    //     console.log(modbusServer.internalDebugLog)
    //     setTimeout(function () {
    //       internalDebugLog(new Error('Something went wrong'));
    //       sinon.assert.calledWith(internalDebugLog, errorMessage);
    //       sinon.assert.calledWith(modbusServer.warn, sinon.match.instanceOf(Error));
    //       done()
    //     }, 0)

    //   })
    // })
  })


  describe('post', function () {
    it('should fail for invalid node', function (done) {
      helper.load(testServerNodes, testFlows.testShouldSendDataOnInputFlow, function () {
        helper.request().post('/modbus-server/invalid').expect(404).end(done)
      })
    })
  })
})
