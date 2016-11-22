/*
(c) Copyright 2016 Hewlett Packard Enterprise Development LP

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

import ServerProfilesListener from './server-profiles';

export default class BotListener extends Listener {
  constructor(robot, client, transform, developer,
    serverHardware, serverProfiles, serverProfileTemplate) {
    super(robot, client, transform);
    this.developer = developer;
    this.serverHardware = serverHardware;
    this.serverProfiles = serverProfiles;
    this.serverProfileTemplate = serverProfileTemplate;

//    this.respond(/(?:get|list|show) \/rest\/(:<category>.*?)\/(:<id>[a-zA-Z0-9_-]*) json\.$/i, ::this.ListRaw);//Developer end point (echoes raw JSON)
    this.respond(/help\.$/i, ::this.ListActions);//Developer end point (echoes a clean resource)
    this.respond(/What can you do(?: for me){0,1}\.$/i, ::this.ListActions);//Developer end point (echoes a clean resource)
  }

  ListActions(msg) {
    return this.transform.text(msg, "I can do lots of things.  I can:\n" +
      this.serverProfiles.capabilities +
      this.serverProfileTemplate.capabilities +
      this.serverHardware.capabilities +
//      this.developer.capabilities +
      "Just ask"
    );
  }

};
