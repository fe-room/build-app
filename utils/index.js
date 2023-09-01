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
    // HBuilderConfig.android = Object.assign({}, HBuilderConfig.android, {
    //   certfile: HBuilderConfig.android.certfile
    //     ? path.join(workDir, HBuilderConfig.android.certfile)
    //     : "",
    // });
    // HBuilderConfig.ios = Object.assign({}, HBuilderConfig.ios, {
    //   profile: HBuilderConfig.ios.profile
    //     ? path.join(workDir, HBuilderConfig.ios.profile)
    //     : "",
    //   certfile: HBuilderConfig.ios.certfile
    //     ? path.join(workDir, HBuilderConfig.ios.certfile)
    //     : "",
    // });
  
    var newConfig = Object.assign({}, HBuilderConfig, info);
    return newConfig;
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
function GetUrl(str) {
  const reg =
    /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
  const strValue = str.match(reg);
  if (strValue && strValue.length > 0) {
    return strValue[0];
  }
  return null;
}

function buildApp() {
  return new Promise(async (resolve, reject) => {
    try {
      var OpenHBuilderCode = await OpenHBuilder();
      if (OpenHBuilderCode !== 0) {
        reject("打开HBuilder编辑器失败");
        return;
      }
      const apps = [];
      buildAppCli(config.ConfigFileName, function (code, data) {
        if(data && code === -2) {
        // code == -2 子进程正在执行
        if(data.indexOf('下载地址:') !== -1) {
           const appUrl = GetUrl(data);
           console.log('打包成功**************提取链接', appUrl)
           if(appUrl) {
             apps.push(appUrl)
           }
        }
        } else if (data && code === -3) {
          // code == -3  进程执行报错
          console.log('进程报错请检查。。。。')
        } else if ( data && code === 0) {
          // code == 0  进程执行完成退出
            console.log("本次成功打包", apps.length);
            resolve(apps)
        }
      });
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
 * @param { string } configFile 临时配置文件路径
 * @param { CallbackHandler } callback
 */
 function buildAppCli(ConfigFilePath, callback) {
  console.log(
    config.HBuilderCli,
    ["pack", "--config", ConfigFilePath].join(" ")
  );


  var pack = cp.spawn(config.HBuilderCli, [
    "pack",
    "--config",
    ConfigFilePath,
  ]);
  pack.stdout.on("data", (data) => {
    console.log(`${data}`)
    const str =  data + ""
    callback && callback(-2, str);
  });

  pack.stderr.on("data", (data) => {
    console.log(`子进程错误:${data}`)
    callback && callback(-3, data);
  });

  pack.on("exit", function (code) {
    console.log(`子进程退出:${code}`)
    callback && callback(code);
  });
}


/**
 * 更改配置文件
 * @param {*} ConfigFilePath
 * @param {*} Config
 * @returns
 */
function WriteConfig(ConfigFilePath, newConfig) {
  const str = JSON.stringify(newConfig, undefined, "\t");
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