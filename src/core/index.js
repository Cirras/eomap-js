import "@spectrum-web-components/theme/theme-darkest.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/sp-theme.js";

import "./components/application";
import "./styles/style.css";

export function getTheme() {
  return document.body.children[0];
}

export function getApplication() {
  return document.getElementById("application");
}

export function installApplication() {
  let application = document.createElement("eomap-application");
  application.id = "application";
  return getTheme().appendChild(application);
}
