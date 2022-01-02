'use strict'

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function buildPrefsWidget() {

    // Copy the same GSettings code from `extension.js`
    this.settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.mudmessaging');

    // Create a parent widget that we'll return from this function
    let prefsWidget = new Gtk.Grid({
        margin: 36,
        column_spacing: 24,
        row_spacing: 12,
        visible: true
    });

    // Create a label & switch for `renabled`
    let enabledLabel = new Gtk.Label({
        label: 'Log checking enabled:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(enabledLabel, 0, 0, 1, 1);

    let enabled = new Gtk.Switch({
        active: this.settings.get_boolean ('enabled'),
        halign: Gtk.Align.END,
        visible: true
    });
    prefsWidget.attach(enabled, 1, 0, 1, 1);

    // Create a label & entry for log file
    let logfileLabel = new Gtk.Label({
        label: 'Log file location',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(logfileLabel, 0, 1, 1, 1);

    let logfile = new Gtk.Entry({
        text: this.settings.get_string ('logfile'),
        halign: Gtk.Align.END,
        placeholder_text: "Type full path to log here...",
        hexpand: true,
        visible: true
    });
    prefsWidget.attach(logfile, 1, 1, 1, 1);    

    // Bind settings to items
    this.settings.bind(
        'enabled',
        enabled,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    this.settings.bind(
        'logfile',
        logfile,
        'text',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Return our widget which will be added to the window
    return prefsWidget;
}
