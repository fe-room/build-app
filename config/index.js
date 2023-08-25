const path = require("path");
const workDir = process.cwd();

console.log("工作路径：", workDir);

// 配置文件
exports.ConfigFileName = path.join(workDir, "publish.json");
exports.manifestFileName = path.join(workDir, "manifest.json");
// 插件生成的临时文件
exports.ConfigFileTemp = path.join(
    workDir,
    "./.hbuilderx/HBuilderConfigTemp.json"
  );

  exports.HBuilderCli = path.join(process.env.HBuilder || "", "cli");