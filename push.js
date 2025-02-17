// LINE DevelopersのMessaging API設定から取得するアクセストークン
// このアクセストークンを使ってLINEサーバーと通信する
const LINE_TOKEN =
  PropertiesService.getScriptProperties().getProperty("LINE_TOKEN");

// 送信先となるLINEユーザーのID（ユーザー固有のIDを設定）
const USER_ID = PropertiesService.getScriptProperties().getProperty("USER_ID");

// LINEのメッセージに返信するためのエンドポイントURL
const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

// 指定したユーザーにメッセージを送信するためのエンドポイントURL
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

// Gmailからメールを取得するメソッド デフォルトで30分前のメールを取得
function getGmailMessage(hour = 0.5) {
  // Gmailから特定条件のスレッドを検索しメールを取り出す
  const unixTime = new Date().getTime(); //UNIX TIMEに変換
  const now = Math.floor(unixTime / 1000); //ミリ秒を秒に変換
  const second = hour * 60 * 60; //指定した時間を秒に変換
  const term = now - second; //現在時刻から指定した秒前の時刻を取得
  const termStr = term.toString(); //検索期間を文字列に変換

  //時間を指定
  const timeQuery = "after:" + termStr;
  // カテゴリーを指定  social:ソーシャルプロモーション、promotions:プロモーションを除外
  const categoryQuery = "-category:social -category:promotions";
  //  クエリを作成
  const strQuery = timeQuery + " " + categoryQuery;
  // めーるを取得
  var threads = GmailApp.search(strQuery);

  //developers.google.com/apps-script/reference/gmail/gmail-thread?hl=ja
  //   .searchで取得するのがGmailThreadのため、GmailMessageに変換し、一つの配列に結合
  let gmails = [];
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    gmails = gmails.concat(messages);
  }
  return gmails;
}

// LINEにメッセージを送信するメソッド
function pushMailMessage(messages) {
  const headers = {
    "Content-Type": "application/json; charset=UTF-8",
    Authorization: "Bearer " + LINE_TOKEN,
  };

  const postData = {
    to: USER_ID,
    messages: messages,
  };

  const options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData),
  };
  return UrlFetchApp.fetch(LINE_PUSH_URL, options);
}

// 30分ごとの自動実行の対象にするメソッド
function sendMessage() {
  // Gmailからメールを取得するメソッドの呼び出し
  const gmails = getGmailMessage();
  // Gmailから取得したメールをLINEに送信
  if (gmails != null) {
    messages = [];
    for (var i = 0; i < gmails.length; i++) {
      //  ドキュメントを参考に  https://developers.google.com/apps-script/reference/gmail/gmail-message?hl=ja
      let sendText =
        "送信者: " +
        gmails[i].getFrom() +
        "\n送信日時: " +
        gmails[i].getDate() +
        "\nタイトル: " +
        gmails[i].getSubject() +
        "\n本文: " +
        gmails[i].getPlainBody();

      //    5000字以上は送ることができないので切り取る
      if (sendText.length > 5000) {
        sendText = sendText.slice(0, 4999); // 4999文字で切り取る
      }

      messages.push({ type: "text", text: sendText });

      // LINEBOTは返信のとき一度に5つまでのメッセージしか送れないため、5つまでに制限
      if ((i + 1) % 5 == 0) {
        // メッセージを送信するメソッドの呼び出し
        let res = pushMailMessage(messages);
        console.log(res);
        messages = [];
      }
    }
    pushMailMessage(messages)
  }
}
