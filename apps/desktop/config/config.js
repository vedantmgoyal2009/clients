function load(envName) {
  return {
    flags: {
      ...loadConfig("base").flags,
      ...loadConfig(envName).flags,
      ...loadConfig("local").flags,
    },
    devFlags: {
      ...loadConfig("base").devFlags,
      ...loadConfig(envName).devFlags,
      ...loadConfig("local").devFlags,
    },
  };
}

function log(configObj) {
  const repeatNum = 50;
  // eslint-disable-next-line
  console.log(`${"=".repeat(repeatNum)}\nenvConfig`);
  // eslint-disable-next-line
  console.log(JSON.stringify(configObj, null, 2));
  // eslint-disable-next-line
  console.log(`${"=".repeat(repeatNum)}`);
}

function loadConfig(configName) {
  try {
    return require(`./${configName}.json`);
  } catch (e) {
    if (e instanceof Error && e.code === "MODULE_NOT_FOUND") {
      return {};
    } else {
      throw e;
    }
  }
}

module.exports = {
  load,
  log,
};
