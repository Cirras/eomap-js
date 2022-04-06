module.exports = (successCallback) => {
  return (error, stats) => {
    if (error) {
      console.error(error.stack || error);
      if (error.details) {
        console.error(error.details);
      }
      return;
    }

    if (stats.hasErrors() || stats.hasWarnings()) {
      const info = stats.toJson();
      info.errors.map((e) => e.message).forEach((m) => console.error(m));
      info.warnings.map((w) => w.message).forEach((m) => console.warn(m));
      return;
    }

    successCallback();
  };
};
