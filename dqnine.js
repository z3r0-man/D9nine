// Firebase AppとDatabaseの読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Firebase初期化
const firebaseConfig = {
  apiKey: "AIzaSyDY_QKyn2w26ZRf1Bw2fgLWMmwVcqIcB4I",
  authDomain: "d9nine-board.firebaseapp.com",
  databaseURL: "https://d9nine-board-default-rtdb.firebaseio.com",
  projectId: "d9nine-board",
  storageBucket: "d9nine-board.firebasestorage.app",
  messagingSenderId: "482410845875",
  appId: "1:482410845875:web:f0d2dc8dd3f97b700e42c6",
  measurementId: "G-JWZSVE2P3Q"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM要素取得
const board = document.getElementById('board');
const textInput = document.getElementById('text');
const postBtn = document.getElementById('postBtn');

const ID_KEY = 'userId';
const LAST_SHUFFLE_KEY = 'lastShuffleMin';

// ------------------------
// ランダムID生成
// ------------------------
function generateRandomId(length = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 初回ID生成
if (!localStorage.getItem(ID_KEY)) {
  localStorage.setItem(ID_KEY, generateRandomId());
}

// 30分ごとのID更新
setInterval(() => {
  const now = new Date();
  const min = now.getMinutes();

  // 0分または30分になったらIDをシャッフル
  if (min === 0 || min === 30) {
    const lastShuffleMin = parseInt(localStorage.getItem(LAST_SHUFFLE_KEY)) || -1;

    if (lastShuffleMin !== min) {
      const newId = generateRandomId();
      localStorage.setItem(ID_KEY, newId);
      localStorage.setItem(LAST_SHUFFLE_KEY, min);
      console.log('IDをシャッフル:', newId);
    }
  }
}, 1000);

// 現在のIDを取得
function getUserId() {
  return localStorage.getItem(ID_KEY);
}

// ------------------------
// 投稿処理
// ------------------------
function postMessage(userId, text) {
  const messagesRef = ref(db, 'messages'); 
  const newMessageRef = push(messagesRef);

  set(newMessageRef, {
    user: userId,
    text: text,
    timestamp: Date.now()
  })
  .then(() => {
    console.log('書き込み成功！');
  })
  .catch((error) => {
    console.error('書き込み失敗:', error);
  });
}

// 投稿ボタン
postBtn.addEventListener('click', () => {
  const userId = getUserId();
  const text = textInput.value.trim();
  if (!text) return; // 空メッセージは無視
  postMessage(userId, text);
  textInput.value = "";
});

// ------------------------
// リアルタイム更新（タイムスタンプ付き）
// ------------------------
const messagesRef = ref(db, 'messages');

onValue(messagesRef, (snapshot) => {
  const data = snapshot.val();
  board.innerHTML = ""; // 一旦クリア

  if (!data) return;

  // timestamp順にソート
  const messages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

  messages.forEach(msg => {
    const div = document.createElement('div');

    // タイムスタンプをフォーマット
    const time = new Date(msg.timestamp);
    const timeString = `${time.getFullYear()}/` +
                       `${(time.getMonth()+1).toString().padStart(2,'0')}/` +
                       `${time.getDate().toString().padStart(2,'0')} ` +
                       `${time.getHours().toString().padStart(2,'0')}:` +
                       `${time.getMinutes().toString().padStart(2,'0')}:` +
                       `${time.getSeconds().toString().padStart(2,'0')}`;

    div.textContent = `[${timeString}] ${msg.user} : ${msg.text}`;
    board.appendChild(div);
  });
});

const form = document.getElementById('myForm');

form.addEventListener('submit', (e) => {
    e.preventDefault(); // ページリロードを防ぐ

    const text = textInput.value.trim();
    if (!text) return;

    const userId = getUserId();
    postMessage(userId, text); // Firebaseに送信
    textInput.value = "";      // 入力欄クリア
});
