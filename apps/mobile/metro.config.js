const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(workspaceRoot, "src", "shared")];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const nextName =
    (moduleName.startsWith(".") || moduleName.startsWith("/") || moduleName.startsWith("@shared/")) &&
    /\.(ts|tsx)$/.test(moduleName)
      ? moduleName.replace(/\.(ts|tsx)$/, "")
      : moduleName;
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, nextName, platform);
  }
  return context.resolveRequest(context, nextName, platform);
};

config.resolver.extraNodeModules = {
  "@shared": path.join(workspaceRoot, "src", "shared"),
};

module.exports = config;
