const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");


/**
 * 下载文件
 * @param {*} url 下传路径
 * @param {*} filepath 下载后存储路径
 */
async function downloadFile(fileUrl, filepath) {
  console.log(fileUrl, filepath, 'fileUrl,filepath')
  // 发起 GET 请求并下载文件
   const response = await axios({
    method: 'get',
    url: fileUrl,
    responseType: 'arraybuffer', // 使用 arraybuffer 格式接收响应数据
  })
  // 从响应头中获取文件名和扩展名
  const contentDisposition = response.headers['content-disposition'];
  const fileNameRegex = /filename[^;\n=]*=((['"]).*?\2|[^;\n]*)/;
  const matches = fileNameRegex.exec(contentDisposition);
  let fileName = 'file'; // 默认文件名

  if (matches && matches[1]) {
    fileName = matches[1].replace(/['"]/g, ''); // 去除引号
  }

  // 本地保存目录
  const savePath = path.join(filepath, fileName);

  // 创建可写流并保存文件
  const writer = fs.createWriteStream(savePath);
  writer.write(response.data);
  writer.end();
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve(savePath));
    writer.on('error', (err)=> {
      resolve('')
      console.log("下载失败", err);
    });
  });
}



module.exports = {
  downloadFile,
};