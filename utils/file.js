const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

/**
 * 上传文件
 * @param {*} uploadUrl 上传路径
 * @param {*} fileUrl 文件路径
 * @param {*} data post的数据
 */
async function upload(uploadUrl, fileUrl, data) {
  console.log("准备上传文件");
  let formData = new FormData();
  let fileData = fs.createReadStream(fileUrl); // 根目录下需要有一个test.jpg文件

  if (data && typeof data == "object") {
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const val = data[key];
        formData.append(key, val);
      }
    }
  }
  formData.append("file", fileData);

  return new Promise((resolve, reject) => {
    axios({
      url: uploadUrl,
      method: "POST",
      data: formData,
      // headers: formData.getHeaders(),
      maxContentLength: `Infinity`,
      maxBodyLength: `Infinity`,
      onUploadProgress(progressEvent) {
        //   console.log("progressEvent", progressEvent);
        if (progressEvent.lengthComputable) {
          //属性lengthComputable主要表明总共需要完成的工作量和已经完成的工作是否可以被测量
          //如果lengthComputable为false，就获取不到progressEvent.total和progressEvent.loaded
          upLoadProgress = (progressEvent.loaded / progressEvent.total) * 100; //实时获取上传进度
          console.log(
            upLoadProgress + "%",
            progressEvent.loaded,
            progressEvent.total
          );
        }
      },
    })
      .then((res) => {
        console.log("上传文件返回", res.data);
        resolve();
      })
      .catch((err) => {
        console.log("上传文件失败", err.message);
        reject(err);
      });
  });
}
// url 是图片地址
// filepath 是文件下载的本地目录
// name 是下载后的文件名
async function downloadFile(url, filepath, name) {
  console.log("准备下载文件", url);
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }
  const mypath = path.join(filepath, name);
  const writer = fs.createWriteStream(mypath);

  // return Promise.resolve(
  //   "F:\\ShouGang\\app\\GasMonitoring\\unpackage\\release\\ipa\\GasMonitoring-09242334.ipa"
  // );
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log("下载完成");
      writer.end();
      resolve(mypath);
    });
    writer.on("error", () => {
      writer.end();
      console.log("下载失败");
      reject("下载失败");
    });
  });
}



module.exports = {
  upload,
  downloadFile,
};