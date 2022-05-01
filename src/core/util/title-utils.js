export function titleFromMapState(mapState) {
  let title = "";
  if (mapState.dirty) {
    title += "● ";
  }
  if (mapState.emf) {
    title += mapState.filename;
    title += " — ";
  }
  title += "Endless Map Editor";
  return title;
}
