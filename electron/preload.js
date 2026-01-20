var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { ipcRenderer, contextBridge } from 'electron';
// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var channel = args[0], listener = args[1];
        return ipcRenderer.on(channel, function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return listener.apply(void 0, __spreadArray([event], args, false));
        });
    },
    off: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var channel = args[0], omit = args.slice(1);
        return ipcRenderer.off.apply(ipcRenderer, __spreadArray([channel], omit, false));
    },
    send: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var channel = args[0], omit = args.slice(1);
        return ipcRenderer.send.apply(ipcRenderer, __spreadArray([channel], omit, false));
    },
    invoke: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var channel = args[0], omit = args.slice(1);
        return ipcRenderer.invoke.apply(ipcRenderer, __spreadArray([channel], omit, false));
    },
    // You can expose other APTs you need here.
    // ...
});
