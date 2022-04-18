import "../../core/components/application";
import "../../core/styles/style.css";

function getApplication() {
  return document.getElementById("application");
}

bridge.receive("close-requested", () => {
  let application = getApplication();
  let callback = () => {
    bridge.send("close-window");
  };

  if (application) {
    if (!application.prompt.open) {
      application.dirtyCheck(callback);
    }
  } else {
    callback();
  }
});
