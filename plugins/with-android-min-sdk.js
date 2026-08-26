const { withProjectBuildGradle } = require("@expo/config-plugins");

const withAndroidMinSdk = (config) => {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language === "groovy") {
      const subprojectFix = `
subprojects { subproject ->
    afterEvaluate {
        if (subproject.plugins.hasPlugin("com.android.library")) {
            subproject.android {
                defaultConfig {
                    minSdkVersion = 24
                }
            }
        }
    }
}
`;
      if (!modConfig.modResults.contents.includes('subproject.plugins.hasPlugin("com.android.library")')) {
        modConfig.modResults.contents += "\n" + subprojectFix;
      }
    }
    return modConfig;
  });
};

module.exports = withAndroidMinSdk;
