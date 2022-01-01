// General imports
const {St, Gio, GLib, GObject} = imports.gi;
const {main, panelMenu, popupMenu} = imports.ui;
const Util = imports.misc.util;

// For converting load_contents guint8/CUCHAR to string
const ByteArray = imports.byteArray;

// Self-reference for init/enable/disable
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// Globals for calling out of functions to self
let menu;

// Extend panelMenu.Button with necessary functionality
const Indicator = GObject.registerClass(
class Indicator extends panelMenu.Button {
    _init() {
        // Init with 0 else no dimensions
        super._init(0);
        // Track last received line to ensure no repetition
        this.lastline = "";

        // Set taskbar icon for extension
        let gicon = Gio.icon_new_for_string(`${Me.path}/icon.svg`);
        let icon = new St.Icon({ gicon, icon_size: 16 });
        this.add_child(icon);

        // Add settings
        this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mudmessaging');

        // Initialize pull-down menu
        // 1. Build log menu & text box
        this.log = Gio.File.new_for_path(this.settings.get_string('logfile'));
        this.menuItem = new popupMenu.PopupMenuItem('Log location:');
        this.logLocation = new St.Label({ text: this.log.get_path() });
        this.menuItem.add_child(this.logLocation);
        // 2. Build button to trigger reload of log file location
        this.menu.addMenuItem(this.menuItem);
        this.updateLog = new popupMenu.PopupMenuItem('Update log location');
        this.updateConnect = this.updateLog.actor.connect('button_press_event', function() {
            this.monitor.cancel();
            this.log = Gio.File.new_for_path(this.logLocation.get_text());
            this.logLocation.set_text(this.settings.get_string('logfile'));
            this._buildMonitor();
        }.bind(this));
        this.menu.addMenuItem(this.updateLog);
        // 3. Build a file monitor to watch log file for changes
        this.fileStream = this.log.read(null);
        // Seek to end of file, then generate a DIS for the monitor to read from
        this.fileStream.seek(0, 2, null);
        this.dataStream = Gio.DataInputStream.new(this.fileStream);
        this._buildMonitor();
        // 4. Add settings menu
        this.settingsItem = new popupMenu.PopupMenuItem('Settings');
		this.settingsConnect = this.settingsItem.connect('button-press-event', () => {
            try {
                let proc = Gio.Subprocess.new(
                    ['gnome-extensions', 'prefs', 'mudmessaging@gastamper.github.io'],
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                )
            }
            catch (e) {
                logError(e);
            }
		});
		this.menu.addMenuItem(this.settingsItem);
    }

    // Build a file monitor to watch for changes, and then notify when such occurs
    _buildMonitor() {
        this.monitor = this.log.monitor(Gio.FileMonitorFlags.NONE, null);
        if ( ! this.monitor ) {
            log("Couldn't create monitor for log file");
        } else {
            this.monitorConnect = this.monitor.connect('changed', function (file, otherfile, eventType) {
                if ( this.settings.get_boolean('enabled') ) {
                    // read_line returns array[byteArray, len]
                    let data = this.dataStream.read_line(null);
                    // Ensure line isn't zero-length
                    if ( data.pop() != 0) {
                        main.notify(ByteArray.toString(data.pop()));
                    }
                }
            }.bind(this));
        }
    }

    _quit() {
        this.monitor.disconnect(this.monitorConnect);
        this.updateLog.disconnect(this.updateConnect);
        this.settingsItem.disconnect(this.settingsConnect);
    }
});

function init() {
    log(`Initializing ${Me.metadata.name} version ${Me.metadata.version}`)
}

function enable() {
    menu = new Indicator();
    main.panel._addToPanelBox('indicator', menu, 1, main.panel._rightBox);
}

function disable() {
    // GNOME shell extensions are required to clean up after themselves
    menu._quit();
    if (menu != null) {
        menu.destroy();
        menu = null;
    }
}