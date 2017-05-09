'use strict';

const Mastodon = require('mastodon');
const INTERVAL = 1000;

const EventEmitter = require('events');

module.exports = (config) => {
  const usedIds = {};
  const botEmitter = new EventEmitter();
  const M = new Mastodon(config);
  let timeout;

  function onData(dataArray, doEmit) {
    dataArray.reverse().forEach((data) => {
      if (data.type === 'mention') {
        if (data.id  && !usedIds[data.id]) {
          if (doEmit) {
            botEmitter.emit('mention', data);
          }
          usedIds[data.id] = true;
        }
      }
    });
  }

  function getNotifications(doEmit) {
    M.get('notifications', {}).then((resp) => {
      if (resp
          && resp.resp
          && resp.resp.statusCode === 200
          && resp.data) {
        onData(resp.data, doEmit);
      } else {
        throw new Error('resp: ' + resp);
      }
    });
  }

  function startPolling() {
    timeout = setInterval(() => getNotifications(true), INTERVAL);
  }

  // don't emit mention from old menuitem
  getNotifications(false);

  function postStatus(text, options = {}) {
    options.status = text;
    M.post('statuses', options).then(() => {});
  }

  botEmitter.postStatus = postStatus;
  botEmitter.startGetNotifications = startPolling;
  botEmitter.stopGetNotifications = () => clearInterval(timeout);

  return botEmitter;
};

