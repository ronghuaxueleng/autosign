/*
更新时间: 2020-12-13 22:30

本脚本仅适用于快手双版本签到，注意正式版Cookie签到有时效性，但Cookie仍然可用于签到极速版，即正式版会掉签；极速版Cookie只能用于极速版
正式版APP获取Cookie方法:
  1.将下方[rewrite_local]地址复制的相应的区域下,无需填写hostname;
  2.打开APP稍等几秒，即可获取Cookie.
极速版获取方法，
  1.把URL的正则改为 https:\/\/nebula\.kuaishou\.com\/nebula\/task\/earning\?，添加hostname = nebula.kuaishou.com;
  2.点击设置页面的"积分兑好礼"即可

兼容Nodejs,把获取的Cookie填入KS_TOKEN，多账号用"&"分开

非专业人士制作，欢迎各位大佬提出宝贵意见和指导
by Sunert
特别感谢
@Chavy
@Nobyda
~~~~~~~~~~~~~~~~

Surge 4.0 :
[Script]
快手 = type=cron,cronexp=35 5 0 * * *,script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/kuaishou.js,script-update-interval=0

快手 = type=http-request,pattern=http:\/\/uploads2\.gifshow\.com\/rest\/n\/system\/speed,script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/kuaishou.js

~~~~~~~~~~~~~~~~
Loon 2.1.0+
[Script]
# 本地脚本
cron "04 00 * * *" script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/kuaishou.js, enabled=true, tag=快手

http-request http:\/\/uploads2\.gifshow\.com\/rest\/n\/system\/speed script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/kuaishou.js

-----------------

QX 1.0.7+ :
[task_local]
0 9 * * * kuaishou.js

[rewrite_local]

http:\/\/uploads2\.gifshow\.com\/rest\/n\/system\/speed url script-request-header https://raw.githubusercontent.com/Sunert/Scripts/master/Task/kuaishou.js

~~~~~~~~~~~~~~~~

*/
const logs = false; //日志开关
const $ = new Env("快手视频");
let cookieArr = [];
let ks_tokens = [];
let speed_code = -1;
const cashType = $.getdata("tpcash_nebula") || "ALIPAY";
if ($.isNode()) {
  if (process.env.KS_TOKEN && process.env.KS_TOKEN.indexOf("&") > -1) {
    ks_tokens = process.env.KS_TOKEN.split("&");
  } else {
    ks_tokens = process.env.KS_TOKEN.split();
  }
} else {
  ks_tokens = $.getdata("cookie_ks") || '{}';
}

ks_tokens = JSON.parse(ks_tokens)

Object.keys(ks_tokens).forEach((item) => {
  if (ks_tokens[item]) {
    cookieArr.push(ks_tokens[item]);
  }
});

!(async () => {
  if (!cookieArr[0]) {
    $.msg($.name, "【提示】🉐登录快手pp获取cookie", "", {
      "open-url":
        "https://live.kuaishou.com/fission/offkwai/index?cc=share_copylink&kpf=IPHONE&traceId=27&fid=1570609569&code=3429390431&shareMethod=token&kpn=KUAISHOU&subBiz=INVITE_CODE&shareId=1000517297081&shareToken=X-1oTjAy1OkMhgQk_AO&platform=copylink&shareMode=app&shareObjectId=3429390431",
    });
    return;
  }
  if ($.isNode()) {
    console.log(
      `============ 脚本执行-国际标准时间(UTC)：${new Date().toLocaleString()}  =============\n`
    );
    console.log(
      `============ 脚本执行-北京时间(UTC+8)：${new Date(
        new Date().getTime() + 8 * 60 * 60 * 1000
      ).toLocaleString()}=============\n`
    );
  }

  for (let i = 0; i < cookieArr.length; i++) {
    if (cookieArr[i]) {
      let cookieVal = cookieArr[i];
      $.index = i + 1;
      console.log(
        `-------------------------\n\n开始【快手视频账号${$.index}】`
      );
      
      await boxExplore(cookieVal, i);
      // await cashSign(cookieVal);
      await speedSign(cookieVal);
      await speedSignifo(cookieVal);
      await speedInfo(cookieVal);
      await nebulaWithdraw(cookieVal);
    }
  }
  await showmsg();
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function cashSign(cookieVal) {
  return new Promise((resolve, reject) => {
    let signurl = {
      url: "https://nebula.kuaishou.com/rest/n/nebula/cashSign/signIn",
      headers: { 
        Host: "nebula.kuaishou.com",
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
        "Content-Type": "application/json;charset=utf-8",
        Cookie: cookieVal 
      },
    };
    $.get(signurl, (error, response, data) => {
      if (logs) $.log(`${$.name}, data: ${data}`);
      $.log(`领取结果: ${data}`)
      resolve();
    });
  });
}

function speedSign(cookieVal) {
  return new Promise((resolve, reject) => {
    let signurl = {
      url: "https://nebula.kuaishou.com/rest/n/nebula/sign/sign",
      headers: { 
        Host: "nebula.kuaishou.com",
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
        "Content-Type": "application/json;charset=utf-8",
        Cookie: cookieVal 
      },
    };
    $.get(signurl, (error, response, data) => {
      if (logs) $.log(`${$.name}, data: ${data}`);
      let speed_res = JSON.parse(data);
      speed_code = speed_res.result;
      if (speed_code == 10007) {
        speed_sign = `签到结果: ${speed_res.error_msg}`;
        // $.msg($.name, '签到结果', `${speed_res.error_msg}`);
        if (logs) $.log(`错误信息: ${speed_res.error_msg}`);
        return;
      } else if (speed_code == 10901) {
        speed_sign = `签到结果: ${speed_res.error_msg}`;
      } else if (speed_code == 1) {
        speed_sign = `签到结果: ${speed_res.data.toast}`;
      }
      resolve();
    });
  });
}
function speedSignifo(cookieVal) {
  return new Promise((resolve, reject) => {
    earnurl = {
      url: "https://nebula.kuaishou.com/rest/n/nebula/sign/query",
      headers: {
        Host: "nebula.kuaishou.com",
        Cookie: cookieVal,
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
        "Content-Type": "application/json;charset=utf-8",
      },
    };
    $.get(earnurl, (error, response, data) => {
      if (logs) $.log(`${$.name}, data: ${data}`);
      let result = JSON.parse(data);
      if (result.result == "1") {
        speed_info = `${result.data.nebulaSignInPopup.subTitle}, ${result.data.nebulaSignInPopup.title}\n`;
      }
      resolve();
    });
  });
}
function speedInfo(cookieVal) {
  return new Promise((resolve, reject) => {
    let reurl = {
      url: "https://nebula.kuaishou.com/rest/n/nebula/activity/earn/overview",
      headers: {
        Host: "nebula.kuaishou.com",
        Cookie: cookieVal,
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
        "Content-Type": "application/json;charset=utf-8",
      },
    };
    $.get(reurl, (error, response, data) => {
      if (logs) $.log(`${$.name}, data: ${data}`);
      let result = JSON.parse(data);
      if (result.result == 1) {
        speed_rewards = `现金收益: 💵${result.data.allCash}元    金币收益: 💰${result.data.totalCoin}`;
      }
      resolve(result.data);
    });
  });
}
//开宝箱
function boxExplore(cookieVal, index) {
  $.log(`快手开宝箱`);
  return new Promise((resolve, reject) => {
    let reurl = {
      url:
        "https://nebula.kuaishou.com/rest/n/nebula/box/explore?isOpen=true&isReadyOfAdPlay=true",
      headers: {
        Cookie: cookieVal,
        Host: "nebula.kuaishou.com",
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
        "content-type": "application/json",
        Accept: "*/*",
        "X-Requested-With": "com.kuaishou.nebula",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        Referer:
          "https://nebula.kuaishou.com/nebula/task/earning?source=timer&layoutType=4&hyId=nebula_earning",
        "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    };
    try {
      $.get(reurl, (error, response, data) => {
        if (logs) $.log(`${$.name}, data: ${data}`);
        let result = JSON.parse(data);
        if (result.result == 1) {
          if (result.data.commonAwardPopup) {
            $.log(`开宝箱获得${result.data.commonAwardPopup.awardAmount}金币`);
            // $.msg(
            //   `【快手视频账号${index}】`,
            //   "",
            //   `开宝箱获得${result.data.commonAwardPopup.awardAmount}金币`
            // );
          } else {
            $.log(`开宝箱失败: ${data}`);
            $.msg(`【快手视频账号${index}】`, "", `开宝箱失败: ${data}`);
          }
        } else {
          $.log(`开宝箱失败: ${data}`);
        }
      });
    } catch (error) {
      $.log(`开宝箱失败: ${error}`);
      $.msg(`【快手视频账号${index}】`, "", `开宝箱失败: ${error}`);
    } finally {
      resolve();
    }
  });
}

function showmsg() {
  ($.sub = ""), ($.desc = "");

  if (speed_code == 1 || speed_code == 10901) {
    $.desc +=
      `【极速版】:\n  ` +
      speed_rewards +
      "\n  " +
      speed_info +
      "  " +
      speed_sign;
  }
  // $.msg($.name, $.sub, $.desc);
}


function nebulaWithdraw(cookieVal) {
  return new Promise((resolve, reject) => {
    $.post(
      nebulaHost(
        cookieVal,
        "outside/withdraw/apply",
        `{"channel":"${cashType}","amount":3}`
      ),
      (error, resp, data) => {
        let result = JSON.parse(data);
        if (result.result == 1) {
          speed_rewards += `提现3元成功`;
        } else {
          $.log(data);
        }
        resolve();
      }
    );
  });
}

function nebulaHost(cookieVal, api, body) {
  return {
    url: "https://nebula.kuaishou.com/rest/n/nebula/" + api,
    headers: {
      Host: "nebula.kuaishou.com",
      Cookie: cookieVal,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
    },
    body: body,
  };
}

function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

