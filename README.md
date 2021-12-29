![Maza shouts 'oeoe'](https://i.imgur.com/NNlnNE1.png)

# MUD messaging plugin
This is a simple plugin designed to watch a log file and popup a notification on the desktop
any time new data is appended (f.e. tells, shouts, etc).

# Install instructions
1. `mkdir -p ~/.local/share/gnome-shell/extensions/arctic@gastamper.github.io`
2. `wget -o https://github.com/gastamper/mudmessaging/archive/refs/heads/master.zip && unzip master.zip -d ~/.local/share/gnome-shell/extensions/mudmessaging@gastamper.github.io && rm master.zip`
3. Reload GNOME with `CTRL-F2`, `r`, `ENTER`.
4. Open the extension by clicking on 'Arctic' in the top right of the screen.
5. Update the log location from `/dev/null` to wherever you are logging to.
6. Press the 'Update log location' button.
7. Configure your MUD client to log whatever messaging you want (tells, etc) to the logfile in *non-append* mode.  Contents should be overwritten on any new messaging.

# TODO:
1. Center notification text (requires extending MessageTray)
2. Reply to tells from notification popup
3. Better text input box for log location
4. Support append mode for log file.
