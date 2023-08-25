const fs = require("fs");
const JSON5 = require("json5");
const path = require("path");
const cp = require("child_process");
const config = require("../config/index.js");
var workDir = process.cwd();
/**
 * 读取工作目录配置文件
 */
function readConfig(FileName) {
    return new Promise((resolve, reject) => {
      fs.readFile(FileName, function (err, data) {
        if (err) {
          reject("读取配置文件错误,检查是否存在" + FileName);
          return;
        }
        var d = String(data);
        try {
          var c = JSON5.parse(d);
          resolve(c);
        } catch (error) {
          console.log(error);
          reject(error);
        }
      });
    });
  }

  function MergeHBuilderConfig(HBuilderConfig = {}, info = {}) {
    HBuilderConfig.android = Object.assign({}, HBuilderConfig.android, {
      certfile: HBuilderConfig.android.certfile
        ? path.join(workDir, HBuilderConfig.android.certfile)
        : "",
    });
    HBuilderConfig.ios = Object.assign({}, HBuilderConfig.ios, {
      profile: HBuilderConfig.ios.profile
        ? path.join(workDir, HBuilderConfig.ios.profile)
        : "",
      certfile: HBuilderConfig.ios.certfile
        ? path.join(workDir, HBuilderConfig.ios.certfile)
        : "",
    });
  
    var newConfig = Object.assign({}, HBuilderConfig, info);
    var str = JSON.stringify(newConfig, undefined, "\t");
    return str;
  }

  /**
 * 打开HBuilder编辑器
 * @returns
 */
function OpenHBuilder() {
  return new Promise(async (resolve, reject) => {
    try {
      var HBuilderConfig = await readConfig(config.ConfigFileName).catch(
        function (err) {
          console.log(err);
        }
      );
      if (!HBuilderConfig) {
        reject(1);
        return;
      }
      console.log(HBuilderConfig, 'process.env.HBuilder')
      return
      var ls = cp.spawn(config.HBuilderCli, ["open"], {});
      ls.on("exit", function (code) {
        if (code === 0) {
          console.log("打开编辑器 状态： 成功" + code);
          // 给hbuilder加载时间
          setTimeout(() => {
            resolve(0);
          }, 4000);
        } else {
          console.log("打开编辑器 状态： 失败" + code);
          reject(code);
        }
      });
    } catch (error) {
      console.log("打开编辑器 错误", error);
      reject(1);
    }
  });
}

  function buildApp() {
    return new Promise(async (resolve, reject) => {
      try {
        var OpenHBuilderCode = await OpenHBuilder();
        if (OpenHBuilderCode !== 0) {
          reject("打开HBuilder编辑器失败");
          return;
        }
        var apps = [];
        console.log(apps, 'apps')
        // buildAppCli(config.ConfigFileTemp, function (code, data) {
        //   // code==-1 自定义错误code,-2是正常数据,-3是错误数据, 其他是进程code
        //   if (code == 0) {
        //     if (apps.length) {
        //       console.log("安装包", apps);
        //     } else {
        //       console.log("未获取到安装包");
        //     }
  
        //     resolve(apps);
        //   } else if (code == -1 && data) {
        //     //自定义异常
        //     console.log(data);
        //     reject(-1, data);
        //   } else if (code == -2 && data) {
        //     //进程正常返回数据
        //     console.log(data);
  
        //     if (
        //       data.indexOf("打包成功") != -1 &&
        //       data.indexOf("安装包位置：") != -1
        //     ) {
        //       // 打包成功    安装包位置：E:/xiangheng/通知订阅/消息订阅/unpackage/release/apk/__UNI__ECA51B4__20220426171608.apk
        //       var appPath = data.split("安装包位置：")[1];
  
        //       if (!appPath) {
        //         reject("打包的路径获取出错");
        //         return;
        //       }
        //       var newAppPath = appPath
        //         .replace(/\//g, "\\")
        //         .replace(/\n/g, "")
        //         .replace(/(\s*$)/g, "");
  
        //       apps.push(newAppPath);
        //     }
        //     if (data.indexOf("iOS Appstore 下载地址:") != -1) {
        //       // ios下载地址
        //       var appUrl = GetUrl(data);
        //       if (appUrl) {
        //         // 下载文件
        //         apps.push(appUrl);
        //       }
        //     }
        //   } else if (code == -3 && data) {
        //     //进程异常返回数据
        //     console.log(data); // 追加一行
        //     reject(data);
        //   }
        // });
      } catch (error) {
        console.log("error", error);
        reject(error);
      }
    });
  }

/**
 *打包app
 *
 * @param {*} rootPath 项目路径
 * @param { string } HBuilderConfigFileTemp 临时配置文件路径
 * @param { CallbackHandler } callback
 */
 function buildAppCli(HBuilderConfigFileTemp, callback) {
  console.log(
    config.HBuilderCli,
    ["pack", "--config", HBuilderConfigFileTemp].join(" ")
  );


  var pack = cp.spawn(config.HBuilderCli, [
    "pack",
    "--config",
    HBuilderConfigFileTemp,
  ]);
  pack.stdout.on("data", (data) => {
    var str = iconv.decode(Buffer.from(data, "binary"), "GBK");
    callback && callback(-2, str);
  });

  pack.stderr.on("data", (data) => {
    var str = iconv.decode(Buffer.from(data, "binary"), "GBK");
    callback && callback(-3, str);
  });

  pack.on("exit", function (code) {
    callback && callback(code);
  });
}


/**
 * 更改配置文件
 * @param {*} ConfigFilePath
 * @param {*} Config
 * @returns
 */
function WriteConfig(ConfigFilePath, str = "") {
  return new Promise((resolve, reject) => {
    fs.mkdir(
      path.dirname(ConfigFilePath),
      {
        recursive: true,
      },
      function (err) {
        if (err) {
          console.log(err);
          return reject(err);
        }
        fs.writeFileSync(ConfigFilePath, str);
        resolve(ConfigFilePath);
      }
    );
  });
}

function MergeManifestConfig(ManifestConfig = {}, info = {}) {
  var newConfig = Object.assign({}, ManifestConfig, info);
  var str = JSON.stringify(newConfig, undefined, "\t");
  return str;
}

  module.exports = {
    readConfig,
    MergeHBuilderConfig,
    MergeManifestConfig,
    buildApp,
    WriteConfig
  }