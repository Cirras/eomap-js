import "phaser";

import { Boot } from "./scenes/boot";
import { Preloader } from "./scenes/preloader";
import { Controller } from "./scenes/controller";
import { patchPhaser } from "./patch-phaser";

import "./components/menubar.js";
import "./components/sidebar.js";

import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import ScrollerPlugin from "phaser3-rex-plugins/plugins/scroller-plugin";
import SliderPlugin from "phaser3-rex-plugins/plugins/slider-plugin";

import "@spectrum-web-components/theme/theme-darkest.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-draw";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-erase";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-sampler";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-pan";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-color-fill";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-star";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/action-group/sp-action-group.js";

import "./styles/style.css";

function startMapper() {
  patchPhaser();
  return new Phaser.Game({
    type: Phaser.AUTO,
    disableContextMenu: true,
    scale: {
      width: "100%",
      height: "100%",
      zoom: 1,
      parent: "mapper",
      mode: Phaser.Scale.ScaleModes.RESIZE,
      resizeInterval: 250,
    },
    loader: {
      maxParallelDownloads: 100,
      async: true,
    },
    render: {
      pixelArt: true,
      powerPreference: "high-performance",
    },
    scene: [Boot, Preloader, Controller],
    plugins: {
      scene: [
        {
          key: "rexUI",
          plugin: UIPlugin,
          mapping: "rexUI",
        },
        {
          key: "scroller",
          plugin: ScrollerPlugin,
          mapping: "scroller",
          start: true,
        },
        {
          key: "slider",
          plugin: SliderPlugin,
          mapping: "slider",
          start: true,
        },
      ],
    },
  });
}

startMapper();
