import { customElement } from "lit/decorators.js";

import { ActionGroup as SpectrumActionGroup } from "@spectrum-web-components/action-group/src/ActionGroup.js";

@customElement("eomap-action-group")
export class ActionGroup extends SpectrumActionGroup {
  focus() {
    // Do nothing
  }

  firstUpdated(changes) {
    super.firstUpdated(changes);
    this.rovingTabindexController.unmanage();
  }
}
