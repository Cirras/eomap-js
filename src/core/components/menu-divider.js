import { css } from "@spectrum-web-components/base";
import { customElement } from "lit/decorators.js";

import { MenuDivider as SpectrumMenuDivider } from "@spectrum-web-components/menu/src/MenuDivider.js";

@customElement("eomap-menu-divider")
export class MenuDivider extends SpectrumMenuDivider {
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          --spectrum-listitem-m-texticon-divider-color: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-listitem-texticon-divider-size: var(
            --spectrum-global-dimension-size-10
          );
          --spectrum-listitem-texticon-divider-padding: 8px;
        }
      `,
    ];
  }
}
