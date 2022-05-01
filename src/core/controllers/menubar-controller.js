import { EventEmitter } from "eventemitter3";
import {
  MenubarState,
  MenuState,
  MenuItemState,
  CheckboxMenuItemState,
  SubmenuMenuItemState,
  DividerMenuItemState,
} from "../state/menubar-state";

export const MenuEvent = {
  New: "new",
  Open: "open",
  OpenRecent: "open-recent",
  Save: "save",
  SaveAs: "save-as",
  MapProperties: "map-properties",
  Settings: "settings",
  ReloadGraphics: "reload-graphics",
  Exit: "exit",
  Undo: "undo",
  Redo: "redo",
  VisibilityFlagToggle: "visibility-flag-toggle",
  DevTools: "toggle-developer-tools",
  About: "about",
};

export class MenuEventSource {
  constructor() {
    this.listeners = [];
  }

  addEventListener(listener) {
    this.listeners.push(listener);
  }

  removeEventListener(listener) {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export class DOMMenuEventSource extends MenuEventSource {
  constructor(node) {
    super();
    for (let key in MenuEvent) {
      let eventType = MenuEvent[key];
      node.addEventListener(eventType, (event) => this.emit(event));
    }
  }
}

export class MenubarController extends EventEmitter {
  constructor(application) {
    super();
    this.application = application;
    this.menubarState = new MenubarState();
    this.eventSources = [];
    application.addController(this);
  }

  addEventSource(eventSource) {
    eventSource.addEventListener((event) => this.handleMenuEvent(event));
    this.eventSources.push(eventSource);
  }

  generateMenubarState() {
    return new MenubarState()
      .withMenu("File", this.generateFileMenu())
      .withMenu("Edit", this.generateEditMenu())
      .withMenu("View", this.generateViewMenu())
      .withMenu("Help", this.generateHelpMenu());
  }

  generateFileMenu() {
    let items = [
      new MenuItemState("New")
        .withEventType(MenuEvent.New)
        .withAccelerator("Ctrl+Alt+N")
        .withEnabled(this.canOpenMaps),
      new MenuItemState("Open")
        .withEventType(MenuEvent.Open)
        .withAccelerator("Ctrl+O")
        .withEnabled(this.canOpenMaps),
      new SubmenuMenuItemState(
        "Open Recent",
        this.generateRecentFilesMenu()
      ).withEnabled(this.canOpenMaps),
      new DividerMenuItemState(),
      new MenuItemState("Save")
        .withEventType(MenuEvent.Save)
        .withAccelerator("Ctrl+S")
        .withEnabled(this.canSaveMaps),
      new MenuItemState("Save As")
        .withEventType(MenuEvent.SaveAs)
        .withAccelerator("Ctrl+Shift+S")
        .withEnabled(this.canSaveMaps),
      new DividerMenuItemState(),
      new MenuItemState("Map Properties")
        .withEventType(MenuEvent.MapProperties)
        .withEnabled(this.canAccessMapProperties),
      new DividerMenuItemState(),
      new MenuItemState("Settings")
        .withEventType(MenuEvent.Settings)
        .withAccelerator("Ctrl+,")
        .withEnabled(this.canAccessSettings),
      new DividerMenuItemState(),
      new MenuItemState("Reload Graphics")
        .withEventType(MenuEvent.ReloadGraphics)
        .withEnabled(this.canReloadGraphics),
    ];

    if (window.isElectron) {
      items.push(
        new DividerMenuItemState(),
        new MenuItemState("Exit").withEventType(MenuEvent.Exit)
      );
    }

    return new MenuState(items).withWidth(250);
  }

  generateRecentFilesMenu() {
    return new MenuState(
      this.recentFiles.map((handle, index) =>
        new MenuItemState(handle.name)
          .withEventType(MenuEvent.OpenRecent)
          .withEventDetail(index)
      )
    );
  }

  generateEditMenu() {
    return new MenuState([
      new MenuItemState("Undo")
        .withEventType(MenuEvent.Undo)
        .withAccelerator("Ctrl+Z")
        .withEnabled(this.canUndo),
      new MenuItemState("Redo")
        .withEventType(MenuEvent.Redo)
        .withAccelerator("Ctrl+Y")
        .withEnabled(this.canRedo),
    ]);
  }

  generateViewMenu() {
    // prettier-ignore
    const MENU_ITEM_DATA = [
      { label: "Ground",     kbd: "Alt+1" },
      { label: "Objects",    kbd: "Alt+2" },
      { label: "Overlay",    kbd: "Alt+3" },
      { label: "Down Wall",  kbd: "Alt+4" },
      { label: "Right Wall", kbd: "Alt+5" },
      { label: "Roof",       kbd: "Alt+6" },
      { label: "Top",        kbd: "Alt+7" },
      { label: "Shadow",     kbd: "Alt+8" },
      { label: "Overlay 2",  kbd: "Alt+9" },
      { label: "Special",    kbd: "Alt+0" },
      { label: "Entities",   kbd: "Alt+E" },
    ];

    return new MenuState(
      MENU_ITEM_DATA.map((info, i) =>
        new CheckboxMenuItemState(info.label)
          .withEventType(MenuEvent.VisibilityFlagToggle)
          .withEventDetail(i)
          .withAccelerator(info.kbd)
          .withChecked(this.layerVisibility.isFlagActive(i))
          .withEnabled(!this.layerVisibility.isFlagOverridden(i))
      )
    );
  }

  generateHelpMenu() {
    let items = [new MenuItemState("About").withEventType(MenuEvent.About)];
    if (window.isElectron) {
      items = [
        new MenuItemState("Toggle Developer Tools")
          .withEventType(MenuEvent.DevTools)
          .withAccelerator("Ctrl+Shift+I")
          .withRegisterAccelerator(true),
        new DividerMenuItemState(),
        ...items,
      ];
    }
    return new MenuState(items);
  }

  hostUpdated() {
    let newMenubarState = this.generateMenubarState();
    if (JSON.stringify(this.menubarState) !== JSON.stringify(newMenubarState)) {
      this.menubarState = newMenubarState;
      this.emit("menubar-state-updated", this.menubarState);
    }
  }

  async handleMenuEvent(event) {
    // Defer to next tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    switch (event.type) {
      case MenuEvent.New:
        this.application.showNewMap();
        break;
      case MenuEvent.Open:
        this.application.open();
        break;
      case MenuEvent.OpenRecent:
        this.application.openRecent(event.detail);
        break;
      case MenuEvent.Save:
        this.application.save();
        break;
      case MenuEvent.SaveAs:
        this.application.saveAs();
        break;
      case MenuEvent.MapProperties:
        this.application.showMapProperties();
        break;
      case MenuEvent.Settings:
        this.application.showSettings();
        break;
      case MenuEvent.ReloadGraphics:
        this.application.loadGFX();
        break;
      case MenuEvent.Exit:
        window.bridge.requestClose();
        break;
      case MenuEvent.Undo:
        this.application.undo();
        break;
      case MenuEvent.Redo:
        this.application.redo();
        break;
      case MenuEvent.VisibilityFlagToggle:
        this.application.toggleVisibilityFlag(event.detail);
        break;
      case MenuEvent.DevTools:
        window.bridge.toggleDevTools();
        break;
      case MenuEvent.About:
        this.application.showAbout();
        break;
    }
  }

  get canOpenMaps() {
    return this.application.validGfx();
  }

  get canSaveMaps() {
    return this.application.mapState.loaded;
  }

  get canAccessMapProperties() {
    return this.application.validGfx() && this.application.mapState.loaded;
  }

  get canAccessSettings() {
    return this.application.settingsState != null;
  }

  get canReloadGraphics() {
    return this.application.canReloadGraphics();
  }

  get canUndo() {
    return this.application.canUndo();
  }

  get canRedo() {
    return this.application.canRedo();
  }

  get recentFiles() {
    return this.application.recentFiles;
  }

  get layerVisibility() {
    return this.application.layerVisibility;
  }
}
