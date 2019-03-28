const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const cors = require('cors');
const { getLyrics } = require('./getLyrics.js')

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(require('cookie-parser')());
app.use(cors());

app.engine('.hbs', hbs({ defaultLayout: 'main', extname: '.hbs' }));
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', function (req, res) {
  const scopes = 'user-read-private user-read-email user-read-birthdate streaming user-read-recently-played user-read-currently-playing user-read-playback-state user-modify-playback-state';
  const myClientId = '2ad921c31cd540dd8d8de3153dd50a72';
  const redirect_uri = 'http://localhost:3000/redirect';
  res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + myClientId +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
    '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

app.get('/redirect', async function (req, res, next) {
  const code = req.query.code;

  const clientId = '2ad921c31cd540dd8d8de3153dd50a72';
  const clientSecret = '6c613051185946abbcf938396efa3d7e';
  const Authorization = `Basic ${new Buffer.from(clientId + ':' + clientSecret).toString('base64')}`;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent('http://localhost:3000/redirect')}`,
    headers: {
          Authorization,
          "Content-Type": "application/x-www-form-urlencoded"
        }
  })

  const parsed = await response.json()
  res.cookie('token', parsed.access_token);

  res.writeHead(302, {
    'Location': 'http://localhost:3000/index'
  });
  res.end();
});

app.get('/index', function (req, res, next) {
  res.render('lyrics');
});

app.get('/api/lyrics', async function (req, res, next) {
  console.log(req.query.artist);
  console.log(req.query.track + '\n');

  const lyrics = await getLyrics(req.query.artist, req.query.track)

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(lyrics));
  res.end()
});

app.listen(3000);
console.log('App is listening on port ' + 3000);