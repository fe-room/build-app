#!/usr/bin/env node

const inquirer = require("inquirer");
const utils = require('../utils/index.js') 
const config = require("../config/index.js");
const PGYERAppUploader = require('../utils/PGYERAppUploader.js');
const file  = require('../utils/file.js')
const wxBot  = require('../utils/wx-bot.js')
const fs = require('fs');
const chalk = require('chalk')
const figlet = require("figlet");
// 下载到本地
const downloadFile = async (appUrl) => {
    const filepath = config.workDir + "/" + "unpackage/clipack"
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath, { recursive: true });
    }
    return await file.downloadFile(
        appUrl,
        filepath
      );
}

const buildFundtion = async () => {
    // 输出Logo
    console.log(chalk.yellow(figlet.textSync('mekoom', { horizontalLayout: 'full' })));
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
    const appKey = HBuilderConfig?.publish?.appKey || ""
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
          message: `请输入更新日志(多条日志请用空格分隔)`,
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
        // if (hbuilderconfig.publish) {
        //   //删除自定义数据部分
        //   delete hbuilderconfig.publish;
        // }
        const packNum = hbuilderconfig.platform.split(',')
        // console.log(hbuilderconfig, '本次打包配置')
        // console.log(packNum.length, '本次打包的app个数')
        // https://hx.dcloud.net.cn/cli/pack
        // 覆盖写入配置文件
        await utils.WriteConfig(config.ConfigFileName, hbuilderconfig);
        const apps = await utils.buildApp();
        // 将打包出来的app在线链接下载到本地
        const downloadPromises = apps.map((file) => downloadFile(file));
        const appUrl = await Promise.all(downloadPromises)
        console.log(`app已下载至${config.workDir}/unpackage/clipack目录下`)
        // 上传到蒲公英
        const uploadPgyer = async (appUrl, description) => {
          const uploadOptions = {
            filePath: appUrl, // 上传文件路径
            log: true, // 显示 log
            buildUpdateDescription: description // 版本更新描述
          }
          return await uploader.upload(uploadOptions)
        }
        // 配置上传蒲公英的地址
        const uploadPromises = appUrl.map((file) => uploadPgyer(file, answers.description));
        const uploadResult = await Promise.all(uploadPromises)
        if(uploadResult && uploadResult.length) {
          // "墨库测试\n\nAndroid版本：\n- 链接：[https://www.pgyer.com/tzQJ ↗]\n- 版本：v3.7.3（build 55）\n- 构建时间:  2023-08-30 09:34:16\n\niOS版本：\n- 链接：[https://www.pgyer.com/W2sT ↗]\n- 版本：v3.7.3（build 46）\n- 构建时间： 2023-08-30 09:34:16\n\n更新内容：\n1. 修复了测试登录问题。\n2. 修复了插件包。"
          let content = `墨库构建成功\n\n`
          let buildUpdateDescription = ''
          uploadResult.forEach((res)=> {
            if(res.code === 0 ) {
              const data = res.data
              // 打包类型
              const buildType  =  data.buildType === 1 ? 'IOS' : 'Android'
              // 打包版本号
              const buildVersion = 'v'+ data.buildVersion 
              // 区分历史版本号
              const buildBuildVersion = data.buildBuildVersion
              // 更新描述
              buildUpdateDescription = data.buildUpdateDescription
              // 更新时间
              const buildUpdated = data.buildUpdated
              // 应用短连接
              const downLoadUrl = `https://www.pgyer.com/${data.buildShortcutUrl}`

              content =  `${content}${buildType}版本：\n- 链接：[${downLoadUrl} ↗]\n- 版本：${buildVersion}（build ${buildBuildVersion}）\n- 构建时间:  ${buildUpdated}` 
            }
          })
          const tips =  buildUpdateDescription.split(' ');
          content = `${content}\n\n更新内容：\n${tips.join('\n')}。`
          console.log('更新通知内容', chalk.green(content))
          // 配置wx通报机器人
          const data = {
            "msgtype": "text",
            "text": {
              "content":  content
            }
          }
          const jsonString = JSON.stringify(data);
          wxBot(jsonString)
        }
      })
      .catch(function (err) {
        console.log("错误信息：", err);
      });
}

buildFundtion()