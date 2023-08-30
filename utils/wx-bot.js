const cp = require("child_process");


module.exports = function (data) {
    const url = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=06830602-4646-4980-ab31-26fd5d5ced79';
    const headers = { 'Content-Type': 'application/json' };
    // 执行 curl 命令
    const curl = cp.spawn('curl', ['-X', 'POST', '-H', JSON.stringify(headers), '-d', data, url]); 
    // 监听子进程的输出
    curl.stdout.on('data', data => {
        console.log(`stdout: ${data}`);
    });

    curl.stderr.on('data', data => {
        console.error(`stderr: ${data}`);
    });
    // 监听子进程的退出事件
    curl.on('close', code => {
        console.log(`子进程退出，退出码: ${code}`);
    });
}