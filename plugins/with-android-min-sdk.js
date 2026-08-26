const { withProjectBuildGradle } = require("@expo/config-plugins");

const withAndroidMinSdk = (config) => {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language === "groovy") {
      const subprojectFix = `
allprojects {
    afterEvaluate { project ->
        if (project.plugins.hasPlugin("com.android.library") || project.plugins.hasPlugin("com.android.application")) {
            project.android {
                defaultConfig {
                    minSdkVersion = 24
                }
            }
        }
    }
}
`;
      if (!modConfig.modResults.contents.includes("defaultConfig {\n                    minSdkVersion = 24")) {
        modConfig.modResults.contents += "\n" + subprojectFix;
      }
    }
    return modConfig;
  });
};

module.exports = withAndroidMinSdk;
