const cp = require("child_process");


module.exports = function (data) {
    const url = process.env.BOT_URL || '';
    const headers = { 'Content-Type': 'application/json' };
    // 执行 curl 命令
    const curl = cp.spawn('curl', ['-X', 'POST', '-H', JSON.stringify(headers), '-d', data, url]); 
    // 监听子进程的输出
    curl.stdout.on('data', data => {
        // console.log(`stdout: ${data}`);
        if(data.errcode == 0 && data.errmsg == 'ok') {
            console.log(`构建信息发送成功！`);
        }
    });
    // curl.stderr.on('data', data => {
    //     console.error(`stderr: ${data}`);
    // });
    // 监听子进程的退出事件
    curl.on('close', code => {
        // console.log(`子进程退出，退出码: ${code}`);
        console.log('自动构建流程结束。')
    });
}