const SpotifyWebApi = require('spotify-web-api-node');
const token = readCookie('token');

const spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(token);

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

spotifyApi.getMe()
  .then(function (data) {
    console.log('Some information about the authenticated user', data.body);
    document.getElementById('user-image').src = data.body.images[0].url;
    document.getElementById('user-name').innerText = data.body.display_name.trim();

  }, function (err) {
    console.log('Something went wrong!', err);
  });


window.onSpotifyWebPlaybackSDKReady = () => {
  const player = new Spotify.Player({
    name: 'Web Playback SDK Quick Start Player',
    getOAuthToken: cb => { cb(token); }
  });

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('authentication_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', ({ message }) => { console.error(message); });

  // Playback status updates
  player.addListener('player_state_changed', async state => {
    fetch(`http://localhost:3000/api/lyrics?artist=${state.track_window.current_track.artists[0].name}&track=${state.track_window.current_track.name}`)
      .then(response =>
        response.json().then(data => ({
          data: data,
          status: response.status
        })
        ).then(res => {
          if (res.data.azlyric.success) {
            document.getElementById('artisttrack').innerText = `${res.data.artist} - ${res.data.track}`
            document.getElementById('lyrics').innerHTML = res.data.azlyric.html
            document.getElementById('logos-src').src = './logos/azlyric.png';
            document.getElementById('logos-href').href = res.data.azlyric.href;
          } else if (res.data.lyricwiki.success) {
            document.getElementById('artisttrack').innerText = `${res.data.artist} - ${res.data.track}`
            document.getElementById('lyrics').innerHTML = res.data.lyricwiki.html
            document.getElementById('logos-src').src = './logos/lyricwiki.png';
            document.getElementById('logos-href').href = res.data.lyricwiki.href;

          } else if (res.data.genius.success) {
            document.getElementById('artisttrack').innerText = `${res.data.artist} - ${res.data.track}`
            document.getElementById('lyrics').innerHTML = res.data.genius.html
            document.getElementById('logos-src').src = './logos/genius.png';
            document.getElementById('logos-href').href = res.data.genius.href;

          } else {
            document.getElementById('artisttrack').innerText = ''
            document.getElementById('lyrics').innerHTML = res.data.genius.html
            document.getElementById('logos-src').src = '';
            document.getElementById('logos-href').href = '';
          }
        }));
  });

  // Ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};