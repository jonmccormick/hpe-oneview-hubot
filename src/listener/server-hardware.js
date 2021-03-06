/*
(c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

import Listener from './base-listener';
import MetricToPng from '../charting/chart';
const Conversation = require('hubot-conversation');

export default class ServerHardwareListener extends Listener {
  constructor(robot, client, transform) {
    super(robot, client, transform);

    this.switchBoard = new Conversation(robot);
    this.room = client.notificationsRoom;

    this.title = "Server hardware (sh)";
    this.capabilities = [];
    this.respond(/(?:turn|power) on (?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?)\.$/i, ::this.PowerOn);
    this.respond(/(?:turn|power) off (?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?)\.$/i, ::this.PowerOff);
    this.capabilities.push(this.indent + "Power on/off a specific (server) hardware (e.g. turn on Encl1, bay 1).");

    this.respond(/(?:get|list|show) all (?:server ){0,1}hardware\.$/i, ::this.ListServerHardware);
    this.capabilities.push(this.indent + "List all (server) hardware (e.g. list all hardware).");

    this.respond(/(?:get|list|show) (?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?) utilization\.$/i, ::this.ListServerHardwareUtilization);
    this.capabilities.push(this.indent + "List server hardware utilization (e.g. list Encl1, bay 1 utilization).");

    this.respond(/(?:get|list|show) (?!\/rest\/server-profiles\/)(?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?)\.$/i, ::this.ListServerHardwareById);
    this.capabilities.push(this.indent + "List server hardware by name (e.g. list Encl1, bay 1).");
  }

  PowerOnHardware(id, msg, suppress) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }
    let startMessage = false;
    return this.client.ServerHardware.setPowerState(id, "On").feedback((res) => {
      if (!suppress && !startMessage && res.associatedResource.resourceHyperlink) {
        startMessage = true;
        this.transform.text(msg, "I am powering on " + this.transform.hyperlink(res.associatedResource.resourceHyperlink, res.associatedResource.resourceName) + ", this may take some time.");
      }
    }).then((res) => {
      if (!suppress) {
        this.transform.send(msg, res, "Finished powering on " + res.name);
      }
    });
  }

  PowerOffHardware(id, msg, suppress) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }
    let startMessage = false;
    return this.client.ServerHardware.setPowerState(id, "Off", "MomentaryPress").feedback((res) => {
      if (!suppress && !startMessage && res.associatedResource.resourceHyperlink) {
        startMessage = true;
        this.transform.text(msg, "Hey " + msg.message.user.name + " I am powering off " + this.transform.hyperlink(res.associatedResource.resourceHyperlink, res.associatedResource.resourceName) + ", this may take some time.");
      }
    }).then((res) => {
      if (!suppress) {
        this.transform.send(msg, res, "Finished powering off " + res.name);
      }
    });
  }

  PowerOn(msg) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power on the blade.  Are you sure you want to do this? (yes/no)");

    dialog.addChoice(/yes/i, () => {
      this.PowerOnHardware(msg.serverId, msg).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }

  PowerOff(msg) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "I don't think I should be doing that if you are in readOnly mode...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power off the blade.  Are you sure you want to do this? (yes/no)");

    dialog.addChoice(/yes/i, () => {
      this.PowerOffHardware(msg.serverId, msg).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }

  ListServerHardware(msg) {
    this.client.ServerHardware.getAllServerHardware().then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerHardwareById(msg) {
    this.client.ServerHardware.getServerHardware(msg.serverId).then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerHardwareUtilization(msg) {
    let p = new Promise ((resolve) => {
      this.client.ServerHardware.getServerUtilization(msg.serverId, {fields: 'AveragePower,PeakPower,PowerCap'}).then((res) => {
        return MetricToPng(this.robot, 'Power', res.metricList, this.room);
      }).then(() => {
        this.robot.logger.debug('Finished creating Power chart.');
        this.client.ServerHardware.getServerUtilization(msg.serverId, {fields: 'AmbientTemperature'}).then((res) => {
          return MetricToPng(this.robot, 'Temperature', res.metricList, this.room);
        }).then(() => {
          this.robot.logger.debug('Finished creating Temperature chart.');
          this.client.ServerHardware.getServerUtilization(msg.serverId, {fields: 'CpuUtilization,CpuAverageFreq'}).then((res) => {
            return MetricToPng(this.robot, 'CPU', res.metricList, this.room);
          }).then(() => {
            this.robot.logger.debug('Finished creating CPU chart.');
            resolve();
          }).catch((err) => {
            return this.transform.error(msg, err);
          });
        }).catch((err) => {
          return this.transform.error(msg, err);
        });
      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    }); //end new promise

    p.then(() => {
      this.robot.logger.info('All charts finsihed.');
      return this.transform.send(msg, "Ok " + msg.message.user.name + " I've finished creating all of the hardware utilization charts.");
    });
  }

}
