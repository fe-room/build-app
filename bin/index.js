#!/usr/bin/env node

const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require('../utils/index.js') 
const config = require("../config/index.js");
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

    if (!HBuilderConfig || !manifest) {
        return;
    }
    // 自定义的发布配置
    let configOptions = [];
    if (HBuilderConfig?.publish) {
      configOptions = Object.keys(HBuilderConfig.publish);
    }
   // 版本号自增 对应mainfest 配置
    const newVersionCode = parseInt(manifest.versionCode) + 1;
    const VersionNameArr = manifest.versionName.split(".");
    const newVersion_1 = [
        VersionNameArr[0],
        VersionNameArr[1],
        parseInt(VersionNameArr[VersionNameArr.length - 1]) + 1,
      ].join(".");
      // 交互
      inquirer.prompt([
         {
            type: "list",
            message: "选择功能",
            name: "function",
            choices: ["打包"],
          },
          {
            type: "list",
            message: "选择打包模式",
            name: "iscustom",
            choices: ["正式版", "自定义基座"],
            when: function (answers) {
              return answers.function == "打包";
            },
            filter: (val) => {
              //将选择的内容后面加内容
              if (val == "正式版") {
                return false;
              }
              return true;
            },
          },
          {
            type: "list",
            message: "打包平台",
            name: "platform",
            choices: ["android", "ios", "android,ios"],
            when: function (answers) {
              return answers.function == "打包";
            },
          }
      ]).then(async function (answers) {
        console.log("answers", answers);
        if (answers.function == "打包") { 
            let hbuilderconfig = utils.MergeHBuilderConfig(HBuilderConfig, {
                iscustom: answers.iscustom,
                platform: answers.platform,
              });
            if (hbuilderconfig.publish) {
                //删除自定义数据部分
                delete hbuilderconfig.publish;
              }
        }
          var apps = await utils.buildApp();
          console.log(apps)
        //   apps.map(async (appUrl) => {
        //     if (appUrl && appUrl.indexOf("https") == 0) {
        //       appUrl = await file.downloadFile(
        //         appUrl,
        //         config.workDir + "/" + "unpackage/release/ipa",
        //         manifest.name + "_" + dayjs().format("YYYYMMDDHHmm") + ".ipa"
        //       );
        //     } else if (appUrl) {
        //       // 安卓才打开浏览器，ios直接打开没用，所有暂时不打卡
  
        //       var url = `http://${utils.getLocalIP()}:${
        //         config.port
        //       }?link=${encodeURIComponent(appUrl)}`;
  
        //       utils.openDefaultBrowser(url);
        //     }
        //     console.log("本地目录：", appUrl);
        //     // 配置上传蒲公英的地址
        //     if (HBuilderConfig?.publish?.upload?.url && appUrl) {
        //       await file
        //         .upload(
        //           HBuilderConfig?.publish?.upload?.url,
        //           appUrl,
        //           HBuilderConfig?.publish?.upload?.formData
        //         )
        //         .catch((err) => {
        //           // console.log("上传",err);
        //         });
        //     }
             // 配置通报机器人
        //   });
      })
      .catch(function (err) {
        console.log("错误信息：", err);
      });
}

buildFundtion()