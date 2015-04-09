/**
 * Web-socket factory using socket.io to communicate with the middleware.
 */
angular.module('ikApp').factory('socket', ['$rootScope', 'debug',
  function ($rootScope, debug) {
    'use strict';

    var factory = {};

    // Get the load configuration object.
    var config = window.config;

    // Communication with web-socket.
    var socket;

    // Global variable with token cookie.
    var token_cookie;

    // Keeps track of connections.
    var reconnection = false;

    /**
     * Cookie object.
     *
     * Used to handle the cookie(s), mainly used to store the connection JSON Web Token.
     */
    var Cookie = (function () {
      var Cookie = function (name) {
        var self = this;

        // Get token from the cookie.
        self.get = function get() {
          var regexp = new RegExp("(?:^" + name + "|\s*" + name + ")=(.*?)(?:;|$)", "g");
          var result = regexp.exec(document.cookie);

          return (result === null) ? undefined : result[1];
        };

        // Set token.
        self.set = function set(value, expire) {
          var cookie = name + '=' + escape(value) + ';';

          if (expire === undefined) {
            expire = 'Thu, 01 Jan 2018 00:00:00 GMT';
          }
          cookie += 'expires=' + expire + ';';

          cookie += 'path=/;';
          cookie += 'domain=' + document.domain + ';';

          // Check if cookie should be available only over https.
          if (config.cookie.secure === true) {
            cookie += ' secure';
          }

          document.cookie = cookie;
        };

        // Remove the cookie by expiring it.
        self.remove = function remove() {
          self.set('', 'Thu, 01 Jan 1970 00:00:00 GMT');
        };
      };

      return Cookie;
    })();

    /**
     * Check if a valid token exists.
     *
     * If a token is found a connection to the proxy is attempted. If token
     * not found the activation form is displayed.
     *
     * If the key url-parameter is set, use that for activation.
     */
    var activation = function activation() {
      // Check if token exists.
      token_cookie = new Cookie('indholdskanalen_token');

      var token = token_cookie.get();

      if (token === undefined) {
        $rootScope.$emit("activationNotComplete");
      }
      else {
        // If token exists, connect to the socket.
        connect(token);
      }
    };

    /**
     * Load the socket.io script from the proxy server.
     */
    var loadSocket = function loadSocket(callback) {
      var file = document.createElement('script');
      file.setAttribute('type', 'text/javascript');
      file.setAttribute('src', config.resource.server + config.resource.uri + '/socket.io/socket.io.js');
      file.onload = function () {
        if (typeof io === "undefined") {
          debug.error("Socket.io not loaded");

          document.getElementsByTagName("head")[0].removeChild(file);
          window.setTimeout(loadSocket(callback), 100);
        } else {
          callback();
        }
      };
      document.getElementsByTagName("head")[0].appendChild(file);
    };

    /**
     * Connect to the web-socket.
     *
     * @param token
     *   JWT authentication token from the activation request.
     */
    var connect = function connect(token) {
      // Get connected to the server.
      socket = io.connect(config.ws.server, {
        'query': 'token=' + token,
        'force new connection': true,
        'max reconnection attempts': Infinity,
        'forceNew': true,
        'reconnection': true,
        'reconnectionDelay': 1000,
        'reconnectionDelayMax' : 5000,
        'reconnectionAttempts': Infinity
      });

      // Handle connected event.
      socket.on('connect', function () {
        // Connection accepted, so lets store the token.
        token_cookie.set(token);

        debug.log("Connection to middleware");

        // If first time we connect change reconnection to true.
        if (!reconnection) {
          reconnection = true;
        }

        // Set ready state at the server, with app initialized if this is a reconnection.
        socket.emit('ready');
      });

      // Handled deletion of screen event.
      socket.on('booted', function (data) {
        // Remove cookie with token.
        token_cookie.remove();

        // Reload application.
        location.reload(true);
      });

      /**
       * @TODO: HANDLE CHANNEL REMOVED EVENT:
       */
      socket.on('channelRemoved', function (data) {
        // Display channel ID of channel to remove.
        $rootScope.$emit('removeChannel', data);
      });

      /**
       * @TODO: HANDLE ERROR EVENT:
       */
      socket.on('error', function (error) {
        debug.error(error);
      });

      socket.on('disconnect', function(){
        debug.info('disconnect');
      });

      socket.on('reconnect', function(){
        debug.info('reconnect');
      });

      socket.on('reconnect_attempt', function(){
        debug.info('reconnect_attempt');
      });

      socket.on('connect_error', function(){
        debug.error('connect_error');
      });

      socket.on('reconnect_error', function(){
        debug.error('reconnect_error');
      });

      socket.on('reconnect_failed', function(){
        debug.error('reconnect_failed');
      });

      // Ready event - if the server accepted the ready command.
      socket.on('ready', function (data) {
        $rootScope.$emit('start', data.screen);

        if (data.statusCode !== 200) {
          // Screen not found will reload application on dis-connection event.
          if (data.statusCode !== 404) {
            debug.log('Code: ' + data.statusCode + ' - Connection error');
          }
        }
        else {
          // Only switch to awaiting content on a first time connection.
          if (!reconnection) {
            $rootScope.$emit('awaitingContent', {});
          }
        }
      });

      // Reload - if the server accepted the pause command.
      socket.on('reload', function (data) {
        // Reload browser windows (by-pass-cache).
        location.reload(true);
      });

      // Channel pushed content.
      socket.on('channelPush', function (data) {
        $rootScope.$emit('addChannel', data);
      });
    };

    /********************************
     * Public methods
     ********************************/

    /**
     * Call this to start the socket connection.
     */
    factory.start = function start() {
      loadSocket(function () {
        return activation();
      });
    };

    /**
     * Activate the screen and connect.
     * @param activationCode
     *   Activation code for the screen.
     */
    factory.activateScreenAndConnect = function activateScreenAndConnect(activationCode) {
      // Build ajax post request.
      var request = new XMLHttpRequest();
      request.open('POST', config.resource.server + config.resource.uri + '/screen/activate', true);
      request.setRequestHeader('Content-Type', 'application/json');

      request.onload = function (resp) {
        if (request.readyState == 4 && request.status == 200) {
          // Success.
          resp = JSON.parse(request.responseText);

          if (typeof Raven !== 'undefined') {
            Raven.setUser({
              id: activationCode
            });
          }

          // Try to get connection to the proxy.
          connect(resp.token);
        }
        else {
          // We reached our target server, but it returned an error
          alert('Activation could not be performed.');
          debug.info('Activation could not be performed.');
        }
      };

      request.onerror = function (exception) {
        // There was a connection error of some sort
        alert('Activation request failed.');
        debug.info('Activation request failed.'):
      };

      // Send the request.
      request.send(JSON.stringify({
        "activationCode": activationCode,
        "apikey": config.apikey
      }));
    };

    return factory;
  }
]);
