// General imports
const {St, Gio, GLib, GObject} = imports.gi;
const {main, panelMenu, popupMenu} = imports.ui;

// For converting load_contents guint8/CUCHAR to string
const ByteArray = imports.byteArray;

// Self-reference for init/enable/disable
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// Globals for calling out of functions to self
let menu;
let thisObj;
let lastline = "";

// Extend panelMenu.Button with necessary functionality
const Indicator = GObject.registerClass(
class Indicator extends panelMenu.Button {
    _init() {
        // Init with 0 else no dimensions
        super._init(0);
        thisObj = this;

        // Set taskbar icon for extension
        let gicon = Gio.icon_new_for_string(`${Me.path}/icon.svg`);
        let icon = new St.Icon({ gicon, icon_size: 16 });
        //let label = new St.Label({ text: "Arctic" });
        //this.add_child(label);
        this.add_child(icon);

        // Initialize pull-down menu
        // 1. Build log menu & text box
        this.log = Gio.File.new_for_path("/dev/null");
        this.menuItem = new popupMenu.PopupMenuItem('Log location:');
        this.logLocation = new St.Label({ text: this.log.get_path() });
        this.logLocation.clutter_text.set_reactive(true);
        this.logLocation.clutter_text.set_editable(true);
        this.logLocation.clutter_text.set_activatable(true);
        this.menuItem.add_child(this.logLocation);
        // 2. Build button to trigger reload of log file location
        this.menu.addMenuItem(this.menuItem);
        this.updateLog = new popupMenu.PopupMenuItem('Update log location');
        this.updateLog.actor.connect('button_press_event', this._updateLogLocation);
        this.menu.addMenuItem(this.updateLog);
        // 3. Build a file monitor to watch log file for changes
        this._buildMonitor();
    }

    _buildMonitor() {
        // Gio.File.Monitor isn't really capable of rendering errors (can't read, etc)
        // so the only real error checking that is possible is on load_contents.
        this.monitor = this.log.monitor(Gio.FileMonitorFlags.NONE, null);
        if ( ! this.monitor ) {
            log("Couldn't create monitor for log file");
        } else {
            this.monitor.connect('changed', function (file, otherfile, eventType) {
                let [success, contents] = thisObj.log.load_contents(null);
                if (success) { 
                    let ba = ByteArray.toString(contents);
                    // For whatever reason, changed signal sends empty lines and will duplicate
                    // the last line written, so check for an exclude all that.
                    if ( ba.length != 0 && ba != lastline ) {
                        lastline = ba;
                        main.notify(ba);
                    }
                } else {
                    main.notify("Reading log file failed");
                }
            });
        }
    }
    _updateLogLocation() {
        thisObj.monitor.cancel();
        thisObj.log = Gio.File.new_for_path(thisObj.logLocation.get_text());
        thisObj._buildMonitor();
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
    if (menu != null) {
        menu.destroy();
        menu = null;
    }
}