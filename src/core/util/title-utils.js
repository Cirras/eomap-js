import { isElectron, isMac } from "./platform-utils";

export function titleFromMapState(mapState) {
  let title = "";
  if (mapState.dirty && !(isElectron() && isMac())) {
    title += "● ";
  }
  if (mapState.emf) {
    title += mapState.filename;
    title += " — ";
  }
  title += "Endless Map Editor";
  return title;
}
