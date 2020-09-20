import Defaults from './modules/defaults';
import Config from './modules/config';
import Binder from './modules/binder';
import Helpers from './modules/helpers';
import Dispatcher from '__dispatcherImport__';

export default (function(root) {
    var _public = {};

    /* Public build variables */
    _public.buildVersion = '__buildVersion__';
    _public.buildEnvironment = '__buildEnvironment__';
    _public.buildDate = '__buildDate__';

    /* Including additional IIFE modules */
    _public.Helpers = Helpers;
    _public.Config = Config;
    _public.Dispatcher = Dispatcher;
    _public.Binder = Binder;

    /* API calls */
    _public.init = function(suppliedConfigObject) {
        if (!suppliedConfigObject) {
            throw Error('LogUI requires a configuration object to be passed to the init() function.');
            return;
        }

        if (!root.LogUI.Config.init(suppliedConfigObject)) {
            throw Error('The LogUI configuration component failed to initialise. Check console warnings for output to see what went wrong.');
        }

        if (!root.LogUI.Dispatcher.init(suppliedConfigObject)) {
            throw Error('The LogUI dispatcher component failed to initialise. Check console warnings for output to see what went wrong.');
        }
    };

    _public.isActive = function() {
        return Config.isActive();
    }

    _public.stop = async function() {
        // https://stackoverflow.com/questions/42304996/javascript-using-promises-on-websocket
        let dispatcherPromise = await Dispatcher.stop();
        Config.reset();
        
        return true;
    };

    _public.updateApplicationSpecificData = function(appSpecificObject) {

    };

    _public.clearSessionData = function() {
        Config.clearSessionUUID();
    };

    return _public;
})(window);