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

// ユーザーがLINEでメッセージを送信した際に自動的に実行される関数
function doPost(e) {
  try {
    // 受け取ったリクエストデータ（LINEから送信されるJSONデータ）をオブジェクトに変換
    const data = JSON.parse(e.postData.contents);

    //replyToken…イベントへの応答に使用するトークン(Messaging APIリファレンス)
    // https://developers.line.biz/ja/reference/messaging-api/#message-event
    const reply_token = data.events[0].replyToken;
    // const messageId = data.events[0].message.id;
    // const messageType = data.events[0].message.type;
    const messageText = data.events[0].message.text;

    // 検証で200を返すための取り組み
    if (typeof reply_token === "underfined") {
      return;
    }

    // LINEメッセージの送信用オプションを設定
    const option = {
      headers: {
        "Content-Type": "application/json; charset=UTF-8", // データ形式をJSONに指定
        Authorization: "Bearer " + LINE_TOKEN, // LINE Bot認証用のアクセストークンを指定
      },
      method: "post",
      payload: JSON.stringify({
        replyToken: reply_token,
        messages: [
          {
            type: "text",
            text: messageText,
          },
        ],
      }),
      muteHttpExceptions: true, // HTTPエラー時も例外を発生させない設定
    };

    // LINEのメッセージ返信用APIにリクエストを送信
    const res = UrlFetchApp.fetch(LINE_REPLY_URL, option);
    console.log(res);

    return;
  } catch (error) {
    // エラーが発生した場合の処理
    console.error("エラーが発生しました: ", error.message);
    console.error(error.stack);
    return ContentService.createTextOutput("Error").setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}
