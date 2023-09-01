const path = require("path");
const workDir = process.cwd();
// 配置文件
exports.ConfigFileName = path.join(workDir, "configure.json");
exports.manifestFileName = path.join(workDir, "manifest.json");
exports.HBuilderCli = path.join(process.env.HBuilder || "", "cli");
exports.workDir = workDir;