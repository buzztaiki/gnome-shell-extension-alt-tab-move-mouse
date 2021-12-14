const { Clutter, Meta } = imports.gi;
const { SwitcherPopup } = imports.ui.switcherPopup;

class Extension {
  constructor() {
    this.orig_method = SwitcherPopup.prototype._finish;
    const seat = Clutter.get_default_backend().get_default_seat();
    this.vdevice = seat.create_virtual_device(
      Clutter.InputDeviceType.POINTER_DEVICE
    );
  }

  enable() {
    const that = this;
    SwitcherPopup.prototype._finish = function () {
      that.move_pointer_maybe();
      that.orig_method.apply(this, arguments);
    };
  }

  disable() {
    SwitcherPopup.prototype._finish = this.orig_method;
  }

  move_pointer_maybe() {
    const window = global.display.focus_window;
    if (!this.pointer_already_on_window(window)) {
      const rect = window.get_frame_rect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      this.vdevice.notify_absolute_motion(global.get_current_time(), x, y);
    }
  }

  pointer_already_on_window(window) {
    const [x, y] = global.get_pointer();
    const prect = new Meta.Rectangle({ x, y, width: 1, height: 1 });
    return prect.intersect(window.get_frame_rect())[0];
  }
}

let extension = null;

function enable() {
  extension = new Extension();
  extension.enable();
}

function disable() {
  extension.disable();
  extension = null;
}

