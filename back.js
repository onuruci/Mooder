var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var router = express.Router();

const app = express();
const port = 3000;
var accesToken = null;
var refreshToken = null;
var moodScore = 0.65;
var lim = 50; //max #songs to look for
var offset = 0.05; //determines range for moodScore
var playlistURL = null;
//var topTrackIds = [];

app.use(express.static('public'));

app.use(express.urlencoded({
  extended: true
}))

var SpotifyWebApi = require('spotify-web-api-node');
const { doesNotMatch } = require('assert');
const { off } = require('process');

var clientId = '408d30106a4d48f08b0d0d3b2a270d9e'; //process.env.SPOTIFY_API_ID,
var clientSecret = 'b057b756a4414cd29f5977b69aabb6a1'; //process.env.SPOTIFY_CLIENT_SECRET;

var scopes = ['user-read-private', 'user-read-email','user-top-read', 
              'playlist-modify-public', 'user-follow-read', 'user-library-read',
              'playlist-modify-private'],
  redirectUri = 'http://localhost:3000/callback',
  clientId = clientId,
  state = 'user-read-playback-state';

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: clientSecret
});

function genName() {
  var i = Math.floor(Math.random() * Math.floor(50));
  return "Mooder Playlist #" + i.toString(10);
}

app.get("/", function (request, response){
  //show this file when the "/" is requested
  response.sendFile(__dirname+"/public/index.html");
});

app.get('/testAuth', (req, res) => {
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  console.log(authorizeURL);
  res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
  var code = req.query.code || null;
  if (code === null) {
      console.log("code is null");
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    // console.log('The token expires in ' + data.body['expires_in']);
    // console.log('The access token is ' + data.body['access_token']);
    // console.log('The refresh token is ' + data.body['refresh_token']);
    // Set the access token on the API object to use it in later calls
    accesToken = data.body['access_token'];
    refreshToken = data.body['refresh_token'];
    spotifyApi.setAccessToken(accesToken);
    spotifyApi.setRefreshToken(refreshToken);
  } catch (err) {
    console.log('Something went wrong!', err);
  }

  spotifyApi.getMySavedTracks({
    limit : lim,
    offset: 1
  })
  .then(function(data) {
    return data.body.items;
  }, function(err) {
    console.log('Something went wrong!', err);
  })
  .then(function(items) {
    let ids = [];
    items.forEach(function(item) {
      ids.push(item.track.id);
    })
    return spotifyApi.getAudioFeaturesForTracks(ids); //2xc8WSkjAp4xRGV6I1Aktb
  })
  .then(function(data) {
    let songs = data.body.audio_features;
    //console.log(songs);
    let filteredSongURIs = [];
    songs.forEach(function(song) {
      if ((song.energy >= moodScore-offset) && (song.energy <= moodScore+offset)) {
        filteredSongURIs.push(song.uri);
      }
    })

    //Create Playlist with filtered songs
    spotifyApi.createPlaylist(genName(), { 'description': 'Enjoy your special playlist!', 'public': true })
    .then(function(data) {
      playlistURL = data.body.external_urls.spotify; //https://open.spotify.com/playlist/2A8Akbr2I1sLXC0wOM5qUk
      return data.body.id;
    }, function(err) {
      console.log('Something went wrong!', err);
    })
    .then(function(playlist) {
      spotifyApi.addTracksToPlaylist(playlist, filteredSongURIs)
    })
    .then(function(data) {
      console.log('Added tracks to playlist!');
    }, function(err) {
      console.log('Something went wrong!', err);
    });
    
  }, function(err) {
    console.log(err);
  });


  res.redirect('/authDone');
});

app.get('/authDone', (req, res) => {
  res.sendFile(__dirname+"/public/callback.html");
});

app.get('/spoti', (req, res) => {
  res.redirect(playlistURL);
});

app.post('/login', (req, res) => {
  moodScore = parseFloat(req.body.result);
  console.log(req.body.result);
  res.redirect('/testAuth');
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.listen(port);