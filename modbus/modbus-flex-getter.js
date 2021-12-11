"use strict";module.exports=function(s){require("source-map-support").install();var r=require("./modbus-basics"),i=require("./core/modbus-core"),t=require("./core/modbus-io-core"),d=require("debug")("contribModbus:flex:getter");s.nodes.registerType("modbus-flex-getter",function(e){s.nodes.createNode(this,e),this.name=e.name,this.showStatusActivities=e.showStatusActivities,this.showErrors=e.showErrors,this.connection=null,this.useIOFile=e.useIOFile,this.ioFile=s.nodes.getNode(e.ioFile),this.useIOForPayload=e.useIOForPayload,this.logIOActivities=e.logIOActivities,this.emptyMsgOnFail=e.emptyMsgOnFail,this.keepMsgProperties=e.keepMsgProperties,this.internalDebugLog=d,this.verboseLogging=s.settings.verbose;var o=this;o.bufferMessageList=new Map,r.setNodeStatusTo("waiting",o);var a=s.nodes.getNode(e.server);a&&(a.registerForModbus(o),r.initModbusClientEvents(o,a),o.onModbusReadDone=function(e,s){o.showStatusActivities&&r.setNodeStatusTo("reading done",o),o.send(t.buildMessageWithIO(o,e.data,e,s)),o.emit("modbusFlexGetterNodeDone")},o.errorProtocolMsg=function(e,s){r.logMsgError(o,e,s),r.sendEmptyMsgOnFail(o,e,s)},o.onModbusReadError=function(e,s){o.internalDebugLog(e.message);s=i.getOriginalMessage(o.bufferMessageList,s);o.errorProtocolMsg(e,s),r.setModbusError(o,a,e,s),o.emit("modbusFlexGetterNodeError")},o.prepareMsg=function(e){return"string"==typeof e.payload&&(e.payload=JSON.parse(e.payload)),e.payload.fc=parseInt(e.payload.fc)||3,e.payload.unitid=parseInt(e.payload.unitid),e.payload.address=parseInt(e.payload.address)||0,e.payload.quantity=parseInt(e.payload.quantity)||1,e},o.isValidModbusMsg=function(e){var s=!0;return Number.isInteger(e.payload.fc)&&1<=e.payload.fc&&e.payload.fc<=4||(o.error("FC Not Valid",e),s&=!1),!s||Number.isInteger(e.payload.address)&&0<=e.payload.address&&e.payload.address<=65535||(o.error("Address Not Valid",e),s&=!1),!s||Number.isInteger(e.payload.quantity)&&1<=e.payload.quantity&&e.payload.quantity<=65535||(o.error("Quantity Not Valid",e),s&=!1),s},o.buildNewMessageObject=function(e,s){var t=i.getObjectId();return{topic:s.topic||e.id,messageId:t,payload:{value:s.payload.value||s.value,unitid:s.payload.unitid,fc:s.payload.fc,address:s.payload.address,quantity:s.payload.quantity,emptyMsgOnFail:e.emptyMsgOnFail,keepMsgProperties:e.keepMsgProperties,messageId:t}}},o.on("input",function(s){if(!r.invalidPayloadIn(s)&&a.client){s=Object.assign({},s);try{var e,t=o.prepareMsg(s);o.isValidModbusMsg(t)&&(e=o.buildNewMessageObject(o,t),o.bufferMessageList.set(e.messageId,r.buildNewMessage(o.keepMsgProperties,t,e)),a.emit("readModbus",e,o.onModbusReadDone,o.onModbusReadError))}catch(e){o.errorProtocolMsg(e,s)}o.showStatusActivities&&r.setNodeStatusTo(a.actualServiceState,o)}}),o.on("close",function(e){r.setNodeStatusTo("closed",o),o.bufferMessageList.clear(),a.deregisterForModbus(o.id,e)}),o.showStatusActivities||r.setNodeDefaultStatus(o))})};
//# sourceMappingURL=maps/modbus-flex-getter.js.map
