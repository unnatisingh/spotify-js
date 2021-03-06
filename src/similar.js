var Artist = require('./artist')
var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var Top = require('./top')

/**
 * Similar entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 * @param {string} [id] - The Spotify ID, if known.
 */
function Similar (spotify, entry, id, trackLimit, artistLimit) {
  /**
   * Array of related artists.
   */
  this.artists = []

  /**
   * Number of artists to fetch.
   */
  this.artistLimit = 20

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Spotify ID.
   */
  this.id = ''

  /**
   * Number of tracks to fetch per artist.
   */
  this.trackLimit = 5

  /**
   * Spotify request handler.
   */
  this.spotify = null

  this.entry = entry.trim()
  this.id = id
  this.spotify = spotify || new SpotifyRequestHandler()
  this.trackLimit = trackLimit || this.trackLimit
  this.artistLimit = artistLimit || this.artistLimit
}

/**
 * Create a queue of tracks.
 * @return {Promise | Queue} A queue of tracks.
 */
Similar.prototype.createQueue = function () {
  var self = this
  var artists = this.artists.map(function (artist) {
    return new Top(self.spotify, self.entry, artist.id, self.limit)
  })
  var queue = new Queue(artists)
  queue = queue.slice(0, self.artistLimit)
  return queue.dispatch().then(function (result) {
    return result.interleave()
  })
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Similar.prototype.dispatch = function () {
  var self = this
  return this.searchForArtist().then(function () {
    return self.searchForRelatedArtists()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Search for artist.
 * @return {Promise} A Promise to perform the action.
 */
Similar.prototype.searchForArtist = function () {
  var self = this
  var artist = new Artist(this.spotify, this.entry)
  return artist.searchForArtist().then(function (artist) {
    self.id = artist.id
  })
}

/**
 * Search for related artists.
 * @return {Promise} A Promise to perform the action.
 */
Similar.prototype.searchForRelatedArtists = function () {
  var self = this
  return this.spotify.searchForRelatedArtists(this.id).then(function (response) {
    self.artists = response.artists
    return self
  })
}

module.exports = Similar
