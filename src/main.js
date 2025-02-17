import Config from './modules/config';
import Dispatcher from '__dispatcherImport__';
import DOMHandler from './modules/DOMHandler/handler';
import EventPackager from './modules/eventPackager';
import MetadataHandler from './modules/metadataHandler';
import SpecificFrameworkEvents from './modules/specificFrameworkEvents';
import EventHandlerController from './modules/eventHandlerController';
import RecordRTCPromisesHandler from 'recordrtc';
import eventPackager from './modules/eventPackager';

export default (function(root) {
    var _public = {};

    /* Public build variables */
    _public.buildVersion = '__buildVersion__';
    _public.buildEnvironment = '__buildEnvironment__';
    _public.buildDate = '__buildDate__';

    _public.Config = Config;

    /* API calls */
    _public.init = async function(suppliedConfigObject) {
        root.addEventListener('logUIShutdownRequest', _public.stop);

        if (!suppliedConfigObject) {
            throw Error('LogUI requires a configuration object to be passed to the init() function.');
        }

        if (!Config.init(suppliedConfigObject)) {
            throw Error('The LogUI configuration component failed to initialise. Check console warnings to see what went wrong.');
        }

        if (!MetadataHandler.init()) {
            throw Error('The LogUI metadata handler component failed to initialise. Check console warnings to see what went wrong.');
        }

        if (!EventPackager.init()) {
            throw Error('The LogUI event packaging component failed to initialise. Check console warnings to see what went wrong.');
        }

        if (!SpecificFrameworkEvents.init()) {
            throw Error('The LogUI events component failed to initialise. Check console warnings to see what went wrong.');
        }

        if (!await Dispatcher.init(suppliedConfigObject)) {
            throw Error('The LogUI dispatcher component failed to initialise. Check console warnings to see what went wrong.');
        }

        if (!DOMHandler.init()) {
            throw Error('The LogUI DOMHandler component failed to initialise. Check console warnings to see what went wrong.');
        }

        if (!EventHandlerController.init()) {
            throw Error('The LogUI event handler controller component failed to initialise. Check console warnings to see what went wrong.');
        }
        
        root.addEventListener('unload', _public.stop);
    };

    _public.isActive = function() {
        return (
            Config.isActive() &&
            Dispatcher.isActive());
    }

    _public.stop = async function() {
        if (!_public.isActive()) {
            throw Error('LogUI may only be stopped if it is currently running.');
        }

        root.removeEventListener('unload', _public.stop);
        root.removeEventListener('logUIShutdownRequest', _public.stop);

        // https://stackoverflow.com/questions/42304996/javascript-using-promises-on-websocket
        DOMHandler.stop();
        EventHandlerController.stop();
        SpecificFrameworkEvents.stop();
        EventPackager.stop();
        MetadataHandler.stop();
        await Dispatcher.stop();
        Config.reset();
        root.dispatchEvent(new Event('logUIStopped'));
    };

    _public.logCustomMessage = function(messageObject) {
        if (!_public.isActive()) {
            throw Error('Custom messages may only be logged when the LogUI client is active.');
        }
        
        EventPackager.packageCustomEvent(messageObject);
    };

    _public.updateApplicationSpecificData = function(updatedObject) {
        if (!_public.isActive()) {
            throw Error('Application specific data can only be updated when the LogUI client is active.');
        }

        Config.applicationSpecificData.update(updatedObject);
        SpecificFrameworkEvents.logUIUpdatedApplicationSpecificData();
    };

    _public.deleteApplicationSpecificDataKey = function(key) {
        Config.applicationSpecificData.deleteKey(key);
        SpecificFrameworkEvents.logUIUpdatedApplicationSpecificData();
    }

    _public.clearSessionID = function() {
        if (_public.isActive()) {
            throw Error('The session ID can only be reset when the LogUI client is inactive.');
        }

        Config.sessionData.clearSessionIDKey();
    };

    let recorder, stream;
    var displayMediaOptions = {
        video: {
          aspectRatio: 1920/1080,
          frameRate: 60,
          cursor: "always"
          
        },
        audio: false
      };

    async function startRecording() {
        stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        var mimeType = 'video/webm';
        if(MediaRecorder.isTypeSupported('video/webm;codecs=h264')){
            mimeType = 'video/webm;codecs=h264';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')){
            mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')){
            mimeType = 'video/webm;codecs=vp8';
        }
        recorder = new RecordRTCPromisesHandler(stream, {
            type: 'video',
            timeSlice: 5000,
            mimeType: mimeType,
            ondataavailable: async function(blob) {
                Dispatcher.sendObject(blob);
            }
          });

        recorder.startRecording();  
    }


    _public.startScreenCapture = async function() {
        await startRecording();
        Config.sessionData.setScreenCaptureTimestamp(new Date());
    }

    _public.stopScreenCapture = async function() {
        await recorder.stopRecording();
        stream.getVideoTracks()[0].stop();
    }

    return _public;
})(window);