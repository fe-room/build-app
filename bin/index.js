#!/usr/bin/env node

const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require('../utils/index.js') 
const config = require("../config/index.js");
const PGYERAppUploader = require('../utils/PGYERAppUploader.js');
const buildFundtion = async () => {
    // 读取Hbuild配置
    let HBuilderConfig = await utils.readConfig(config.ConfigFileName)
    .catch(function (err) {
      console.log(err);
    });
     // 读取mainfest配置
    let manifest = await utils.readConfig(config.manifestFileName)
    .catch(function (err) {
      console.log(err);
    });
    // 初始化蒲公英上传
    const appKey = HBuilderConfig?.publish?.appKey || ''
    const uploader = appKey ? new PGYERAppUploader(appKey) : null;
    if (!HBuilderConfig || !manifest) {
        return;
    }
   // 版本号对应mainfest 配置
    const versionName = manifest.versionName;
    const versionCode = parseInt(manifest.versionCode);
    // 交互
    inquirer.prompt([
        {
          type: "list",
          message: "选择打包模式",
          name: "iscustom",
          choices: ["正式版", "自定义基座"],
          filter: (val) => {
            //将选择的内容后面加内容
            if (val == "正式版") {
              return false;
            }
            return true;
          },
        },
        {
          type: "confirm",
          message: `应用版本名称${versionName}:应用版本号${versionCode}确认无误？`,
          name: 'version',
          when: answers => !answers.iscustom
        },
        {
          type: "list",
          message: "打包平台",
          name: "platform",
          choices: ["android", "ios", "android,ios"],
          when: answers => !answers.iscustom
        },
        {
          type: "Input",
          message: `请输入更新日志`,
          name: 'description',
          when: answers => !answers.iscustom
        },
    ]).then(async function (answers) {
      if(!answers.version && !answers.iscustom) {
        return console.log('请确认并修改版本号后再进行打包操作!')
      }
      console.log("answers", answers);
      return 
      //整合配置文件
      let hbuilderconfig = utils.MergeHBuilderConfig(HBuilderConfig, {
          iscustom: answers.iscustom,
          platform: answers.platform,
        });
        if (hbuilderconfig.publish) {
          //删除自定义数据部分
          delete hbuilderconfig.publish;
        }
        // const apps = await utils.buildApp();
        console.log(apps)
        apps.forEach(async (appUrl) => {
          if (appUrl && appUrl.indexOf("https") == 0) {
            appUrl = await file.downloadFile(
              appUrl,
              config.workDir + "/" + "unpackage/release/ipa",
              manifest.name + "_" + dayjs().format("YYYYMMDDHHmm") + ".ipa"
            );
          } else if (appUrl) {
            // 安卓才打开浏览器，ios直接打开没用，所有暂时不打卡

            var url = `http://${utils.getLocalIP()}:${
              config.port
            }?link=${encodeURIComponent(appUrl)}`;

            utils.openDefaultBrowser(url);
          }
          console.log("本地目录：", appUrl);
          // 配置上传蒲公英的地址
          if (uploader && appUrl) {
            const uploadOptions = {
              filePath: appUrl, // 上传文件路径
              log: true, // 显示 log
              buildUpdateDescription: answers.description // 版本更新描述
            }
            uploader.upload(uploadOptions).then(console.log).catch(console.error);
          }
          // 配置通报机器人
        });
      })
      .catch(function (err) {
        console.log("错误信息：", err);
      });
}

buildFundtion()