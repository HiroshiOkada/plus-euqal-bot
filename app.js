const fs = require('fs');

const botBase = require('./bot-base');

const CONFIG_FNAME = './config.json';
const DICT_FNAME = './dict.json';
const config = JSON.parse(fs.readFileSync(CONFIG_FNAME, 'utf8'));

function removeTag(htmlText) {
  return htmlText.toString().replace(/<[^>]*>/g, '');
}

function removeAtName(text) {
  return text.replace(/^(@[a-zA-Z0-9_]{1,31}\s*)*/, '');
}

const NUM_REX =  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)$/;
const dict = JSON.parse(fs.readFileSync(DICT_FNAME, 'utf8'));

// 辞書に登録する、一致の可能性を増やすために
// 大文字小文字をそのままにしたパタンと
// 小文字に変換したパタンを登録する。
// さらに逆引きも登録する
function dictAdd(q0, q1, a) {
  dict[q0+'+'+q1] = a;
  if (!dict[q0.toLowerCase()+'+'+q1.toLowerCase()]) {
    dict[q0.toLowerCase()+'+'+q1.toLowerCase()] = a;
  }
  dict.r[a] = q0.toLowerCase()+' + '+q1.toLowerCase();
  fs.writeFile(DICT_FNAME, JSON.stringify(dict, null, 2));
}

// 辞書を引く
// 大文字小文字まで一致したものがなければ、
// 小文字に変換したパタンをで検索し、返す
function dictGet(q0, q1) {
  return dict[q0+'+'+q1] || dict[q0.toLowerCase()+'+'+q1.toLowerCase()];
}

// 人口無能処理
function munou(text) {
  let qa = text.split('=', 2).map(w => w.trim());

  // テキストが空
  if (qa.length === 0) {
    return null;
  }

  // 逆引き
  if (dict.r[qa[0]]) {
    return `${qa[0]} = ${dict.r[qa[0]]}`;
  }

  let q = qa[0].split('+', 2).map(w => w.trim());

  // + 記号が存在しない
  if (q.length !== 2) {
    return null;
  }

  // a + b = c の形, 辞書に登録
  if (qa.length === 2 && qa[1] !== '') {
    dictAdd(q[0], q[1], qa[1]);
    return `I lerned.\n${q[0]} + ${q[1]} = ${qa[1]}`;
  }

  // 辞書にある
  if(dictGet(q[0],q[1])) {
    return  `${q[0]} + ${q[1]} = ${dictGet(q[0],q[1])}`;

  // 数値計算
  } else if (NUM_REX.test(q[0]) && NUM_REX.test(q[1])) {
    return `${q[0]} + ${q[1]} = ${parseFloat(q[0]) + parseFloat(q[1])}`;
  }


  // 知りません
  return `I don't know. ${q[0]} + ${q[1]}`;
}


const bot = botBase({
  access_token: config.access_token,
  api_url: 'https://' + config.host_name + '/api/v1/'
});

bot.on('mention', function(data) {

  if (data.status) {
    let text = removeAtName(removeTag(data.status.content));

    let answer = munou(text);

    if (answer) {
      bot.postStatus('@' + data.account.acct + ' ' + answer, { in_reply_to_id: data.status.id });
    }
  }
});

bot.startGetNotifications();

