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

import Resource from './resource';
import { getDeviceName } from '../../../middleware/utils/lexer';

export default class ServerProfile extends Resource {

  constructor(oneViewResource) {
    if (oneViewResource) {
      super(oneViewResource);
      this.name = oneViewResource.name;
      this.affinity = oneViewResource.affinity;
      this.serialNumber = oneViewResource.serialNumber;
      this.serverHardwareUri = oneViewResource.serverHardwareUri;
      this.serverHardwareHyperlink = oneViewResource.serverHardwareHyperlink;
    }
  }

  buildSlackFields() {
    let fields = [];
    for (const field in this) {
      if (this.__isNonDisplayField__(field) || !this[field]) {
        continue;
      }

      let displayField = this.camelCaseToTitleCase(field);

      fields.push({
        title: displayField,
        short: true,
        value: this[field]
      });
    }
    if (this.serverHardwareUri) {
      fields.push({
        title: 'Server Hardware',
        short: true,
        value: '<' + this.serverHardwareHyperlink + '|' + getDeviceName(this.serverHardwareUri) + '>'
      });
    }
    return fields;
  }

  buildHipChatOutput() {
    let output = '';
    for (const field in this) {
      if (this.__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      output += '\t\u2022 ' + field + ': ' + this[field] + '\n';
    }
    if (this.serverHardwareUri) {
      output += '\t\u2022 Server Hardware: ' + getDeviceName(this.serverHardwareUri) + '\n';
    }
    //Add status to output only for HipChat
    output += '\t\u2022 Status: ' +  this.status + '\n';
    return output;
  }

  __isNonDisplayField__(field){
    var nonDisplayFields = ['name', 'type', 'status', 'serverhardwareuri', 'serverhardwarehyperlink', 'hyperlink'];
    return nonDisplayFields.includes(field.toLowerCase());
  }
}
