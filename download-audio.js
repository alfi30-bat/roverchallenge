const https = require('https');
const fs = require('fs');

const url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'; // Valid MP3 URL
const dest = 'assets/audio/space.mp3';

if (!fs.existsSync('assets/audio')) {
  fs.mkdirSync('assets/audio', { recursive: true });
}

const file = fs.createWriteStream(dest);
https.get(url, function (response) {
  response.pipe(file);
  file.on('finish', function () {
    file.close();
    console.log("Audio downloaded successfully.");
  });
}).on('error', function (err) {
  fs.unlink(dest);
  console.error("Error downloading audio: " + err.message);
});
