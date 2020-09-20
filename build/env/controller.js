var LogUITestEnvDriver = (function(root) {
    var _public = {};
    var initTimestamp = null;
    var detectReference = null;
    var startStopReference = null;
    
    const $ = root.document.querySelector.bind(root.document);
    const $$ = root.document.querySelectorAll.bind(root.document);

    const CONFIG_OBJECT = window.config;
    const CONSOLE_LIST_ELEMENT = $('#console-list');

    const STATUS_MESSAGES = {
        'unloaded': 'LogUI unloaded',
        'inactive': 'LogUI loaded; inactive',
        'starting': 'LogUI loaded; starting...',
        'stopping': 'LogUI loaded; stopping...',
        'active': 'LogUI loaded; active'
    }

    _public.init = function() {
        initTimestamp = new Date();
        _public.clearConsole();
        _public.addEnvMessage('Initialising test environment');
        _public.addEnvMessage('Messages with a blue background (like this) are from the test environment.');
        setStatus('unloaded');
        
        detectReference = window.setInterval(detectLogUI, 500);
        bindButtonListeners();
    };

    _public.addEnvMessage = function(msg) {
        let newNode = document.createElement('li');
        let textNode = document.createTextNode(msg);
        newNode.appendChild(textNode);
        newNode.classList.add('env');

        CONSOLE_LIST_ELEMENT.insertBefore(newNode, CONSOLE_LIST_ELEMENT.firstChild);
    };

    _public.clearConsole = function() {
        CONSOLE_LIST_ELEMENT.innerHTML = '';
    };

    function bindButtonListeners() {
        $('#control-clear').addEventListener('click', function() {
            _public.clearConsole();
        });

        $('#control-start').addEventListener('click', function() {
            _public.addEnvMessage('Starting LogUI');
            setStatus('starting');
            $('#control-start').disabled = true;

            window.LogUI.init(window.config);
            startStopReference = window.setInterval(startLogUICompleteCheck, 200);
        });

        $('#control-stop').addEventListener('click', function() {
            _public.addEnvMessage('Stopping LogUI');
            setStatus('stopping');

            $('#control-stop').disabled = true;

            window.LogUI.stop().then(function(resolved) {
                $('#control-start').disabled = false;
                setStatus('inactive');
                _public.addEnvMessage('LogUI stopped');
            });
        });
    };

    function setStatus(statusKey) {
        $('#control-status').innerText = STATUS_MESSAGES[statusKey];

        if (statusKey == 'inactive') {
            $('#control-version').style.display = 'inline';
            $('#control-version').innerText = `Version ${LogUI.buildVersion}`;
        }
    };

    function detectLogUI() {
        if (window.LogUI) {
            window.clearInterval(detectReference);
            setStatus('inactive');
            $('#control-start').disabled = false;
        }
    };

    function startLogUICompleteCheck() {
        if (window.LogUI.isActive()) {
            window.clearInterval(startStopReference);
            $('#control-stop').disabled = false;
            setStatus('active');
            _public.addEnvMessage('LogUI started; listening for events');
        }
    };
    
    return _public;
})(window);

document.addEventListener('DOMContentLoaded', function() {
    LogUITestEnvDriver.init();
});