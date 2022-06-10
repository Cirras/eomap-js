import { html } from "lit";

import "../components/menu";
import "../components/menu-item";
import "../components/menu-divider";
import "../components/submenu-item";

export function renderMenuItem(item) {
  switch (item.type) {
    case "normal":
      return renderNormal(item);
    case "checkbox":
      return renderCheckbox(item);
    case "submenu":
      return renderSubmenu(item);
    case "separator":
      return renderDivider(item);
  }
}

function renderNormal(item) {
  return html`
    <eomap-menu-item
      role="${getRole(item)}"
      aria-label="${item.label}"
      aria-keyshortcuts="${getKeyshortcuts(item)}"
      ?disabled=${!item.enabled}
      @menu-item-press=${getOnMenuItemPress(item)}
    >
      ${item.label} ${renderKeybinding(item)}
    </eomap-menu-item>
  `;
}

function renderCheckbox(item) {
  return html`
    <eomap-menu-item
      role="${getRole(item)}"
      aria-label="${item.label}"
      aria-checked="${item.checked}"
      aria-keyshortcuts="${getKeyshortcuts(item)}"
      ?disabled=${!item.enabled}
      .selected=${item.checked}
      @menu-item-press=${getOnMenuItemPress(item)}
    >
      ${item.label} ${renderKeybinding(item)}
    </eomap-menu-item>
  `;
}

function getKeyshortcuts(item) {
  if (item.keybinding) {
    return item.keybinding.ariaLabel.string;
  }
  return "";
}

function getOnMenuItemPress(item) {
  return function (_event) {
    if (item.eventType) {
      this.dispatchEvent(
        new CustomEvent(item.eventType, {
          detail: item.eventDetail,
          bubbles: true,
          composed: true,
        })
      );
    }
  };
}

function renderKeybinding(item) {
  if (item.keybinding) {
    return html` <kbd slot="value"> ${item.keybinding.uiLabel.string} </kbd>`;
  }
}

function renderSubmenu(item) {
  let menuStyle = "";
  if (item.width !== null) {
    menuStyle = `width: ${item.width}px`;
  }
  return html`
    <eomap-submenu-item
      role="${getRole(item)}"
      aria-label="${item.label}"
      ?disabled=${!item.enabled || item.menu.items.length === 0}
    >
      ${item.label}
      <eomap-menu style="${menuStyle}" slot="menu">
        ${item.menu.items.map(renderMenuItem)}
      </eomap-menu>
    </eomap-submenu-item>
  `;
}

function renderDivider(item) {
  return html`
    <eomap-menu-divider role="${getRole(item)}"> </eomap-menu-divider>
  `;
}

function getRole(item) {
  switch (item.type) {
    case "normal":
    case "submenu":
      return "menuitem";
    case "checkbox":
      return "menuitemcheckbox";
    case "separator":
      return "separator";
    default:
      return "none";
  }
}
