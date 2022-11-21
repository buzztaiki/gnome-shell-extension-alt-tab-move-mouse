// Copyright (C) 2022  Lucas Emanuel Resck
// Copyright (C) 2022  vakokako
// Copyright (C) 2021  Taiki Sugawara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const { Clutter, Meta, GObject } = imports.gi;
const Main = imports.ui.main;
const altTab = imports.ui.altTab;

let CurrentMonitorAppSwitcherPopup;

function init() {
    CurrentMonitorAppSwitcherPopup = GObject.registerClass(
        class CurrentMonitorAppSwitcherPopup extends altTab.AppSwitcherPopup {
            _finish(timestamp) {
                let appIcon = this._items[this._selectedIndex];
                if (this._currentWindow < 0) {
                    extension.movePointerMaybe(appIcon.cachedWindows[0]);
                }
                super._finish(timestamp);
            }
        }
	);
}

class Extension {
  constructor() {
    this.origMethods = {
      "Main.activateWindow": Main.activateWindow,
      "appSwitcherPopup": altTab.AppSwitcherPopup
    };
    Main.activateWindow = (window, ...args) => {
      this.movePointerMaybe(window);
      this.origMethods["Main.activateWindow"](window, ...args);
    };
    altTab.AppSwitcherPopup = CurrentMonitorAppSwitcherPopup;
    const seat = Clutter.get_default_backend().get_default_seat();
    this.vdevice = seat.create_virtual_device(
      Clutter.InputDeviceType.POINTER_DEVICE
    );
  }

  destroy() {
    Main.activateWindow = this.origMethods["Main.activateWindow"];
    altTab.AppSwitcherPopup = this.origMethods["appSwitcherPopup"];
  }

  movePointerMaybe(window) {
    if (!this.pointerAlreadyOnWindow(window)) {
      const rect = window.get_frame_rect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      this.vdevice.notify_absolute_motion(global.get_current_time(), x, y);
    }
  }

  pointerAlreadyOnWindow(window) {
    const [x, y] = global.get_pointer();
    const rect = new Meta.Rectangle({ x, y, width: 1, height: 1 });
    return rect.intersect(window.get_frame_rect())[0];
  }
}

let extension = null;

/* exported enable */
function enable() {
  extension = new Extension();
}

/* exported disable */
function disable() {
  extension.destroy();
  extension = null;
}
