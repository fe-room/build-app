#!/usr/bin/env node

const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require('../utils/index.js') 
const config = require("../config/index.js");
const PGYERAppUploader = require('../utils/PGYERAppUploader.js');
const file  = require('../utils/file.js')
const wxBot  = require('../utils/wx-bot.js')
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
      //整合配置生成打包配置
      let hbuilderconfig = utils.MergeHBuilderConfig(HBuilderConfig, {
          iscustom: answers.iscustom,
          platform: answers.platform,
        });
        if (hbuilderconfig.publish) {
          //删除自定义数据部分
          delete hbuilderconfig.publish;
        }
        console.log(hbuilderconfig, '合并后的配置hbuliderconfig')
        // await utils.WriteConfig(config.ConfigFileName, hbuilderconfig);
        // const apps = await utils.buildApp();
        // console.log(apps)
        // 将打包出来的app在线链接下载到本地
        // const appUrl = 'https://ide.dcloud.net.cn/build/download/c1dc4f70-4632-11ee-aec0-395d202c5bb7'
        // if (appUrl && appUrl.indexOf("https") == 0) {
        //   appUrl = await file.downloadFile(
        //     appUrl,
        //     config.workDir + "/" + "unpackage/release"
        //   );
        //   console.log(appUrl, 'appUrl')
        // } 
        // const appUrl = config.workDir + "/" + "unpackage/release/" + '__UNI__9613C89_0829141537.apk'
          return
          // 配置上传蒲公英的地址
          if (uploader && appUrl) {
            const uploadOptions = {
              filePath: appUrl, // 上传文件路径
              log: true, // 显示 log
              buildUpdateDescription: answers.description // 版本更新描述
            }
            uploader.upload(uploadOptions).then((res)=> {
              console.log(res)
            
            }).catch(console.error);
          }
          // 配置wx通报机器人
          const data = {
            "msgtype": "text",
            "text": {
              "content": "墨库测试\nhttps://www.pgyer.com/tzQJ  v3.7.3（build55） 安卓\nhttps://www.pgyer.com/W2sT  v3.7.3（build46） ios\n更新内容:\n1. 自提扫码过期登录和第三方一键登录问题\n2.共读会和社区的bug"
            }
          }
          wxBot(data)
      })
      .catch(function (err) {
        console.log("错误信息：", err);
      });
}

buildFundtion()