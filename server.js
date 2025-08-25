require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { formidable } = require('formidable');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '')));

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

app.post('/api/upload', (req, res) => {
  if (!IMGBB_API_KEY) {
    return res.status(500).json({ success: false, message: 'サーバーにAPIキーが設定されていません。' });
  }

  // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  // この部分で、一時ファイルの保存場所をプロジェクトフォルダ内に指定します
  const form = formidable({ uploadDir: __dirname });
  // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

  form.parse(req, async (err, fields, files) => {
    const fetch = (await import('node-fetch')).default;
    if (err) {
      console.error("画像解析エラー:", err);
      return res.status(500).json({ success: false, message: '画像の解析に失敗しました。' });
    }
    
    try {
      if (!files.file || !files.file[0]) {
        return res.status(400).json({ success: false, message: '画像ファイルが見つかりません。' });
      }
      const imageFile = files.file[0];
      const imageAsBase64 = fs.readFileSync(imageFile.filepath, 'base64');
      
      // 一時ファイルを削除
      fs.unlinkSync(imageFile.filepath);
      
      const formData = new URLSearchParams();
      formData.append('image', imageAsBase64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        res.status(200).json({ success: true, data: result.data });
      } else {
        console.error("imgbb APIからのエラー:", result.error ? result.error.message : '不明なエラー');
        res.status(500).json({ success: false, message: result.error ? result.error.message : '不明なエラー' });
      }
    } catch (error) {
      console.error("アップロード処理中のエラー:", error);
      res.status(500).json({ success: false, message: 'アップロード処理中にエラーが発生しました。' });
    }
  });
});

app.listen(port, () => {
  console.log(`-------------------------------------------------`);
  console.log(`✅ imgbb用サーバーが起動しました！`);
  console.log(`↓↓↓ このURLをブラウザで開いてください ↓↓↓`);
  console.log(`http://localhost:${port}`);
  console.log(`-------------------------------------------------`);
});