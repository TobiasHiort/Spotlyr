const rp = require('request-promise');
const accents = require('remove-accents');

/**
 * Cleans and formats lyrics paths to azlyrics.com, genius.com and lyrics.wikia.com
 * @param {string} artist The artist
 * @param {string} track The track
 * @returns {object} The formatted paths in an object
 */
function getPathsArtistTrack(artist, track) {
  const cleanAZlyrics = str => str.toLowerCase().replace(/[\'´`&']/, '').replace(/\s+/g, '');
  const cleanGenius = str => str.toLowerCase().replace(/[\'´`&']/, '').replace(/\s+/g, '-');
  const cleanLyricWiki = str => str.toLowerCase().replace(/[\'´`&']/, '').replace(/\s+/g, '_');

  const artistFormattedAZLyrics = cleanAZlyrics(accents.remove(artist));
  const trackFormattedAZLyrics = cleanAZlyrics(accents.remove(track));

  const artistFormattedGenius = cleanGenius(accents.remove(artist));
  const trackFormattedGenius = cleanGenius(accents.remove(track));

  const artistFormattedLyricWiki = cleanLyricWiki(accents.remove(artist));
  const trackFormattedLyricWiki = cleanLyricWiki(accents.remove(track));

  return {
    azlyric: artistFormattedAZLyrics + '/' + trackFormattedAZLyrics + '.html',
    lyricwiki: artistFormattedLyricWiki + ':' + trackFormattedLyricWiki,
    genius: artistFormattedGenius + '-' + trackFormattedGenius + '-lyrics'
  }
}

/**
 * Scrapes the full webpage HTML using request-promise
 * @param {string} url The URL of a page to be scraped
 * @returns {string} The full string HTML of the requested web page
 */
async function getHtml(url) {
  let pageHtml = '';
  await rp(url)
    .then(html => pageHtml = html)
    .catch(err => { throw new Error(err); });

  return pageHtml
}

/**
 * Formats scraped HTML to pure lyrics HTML from azlyrics.com
 * @param {string} url The URL to a lyrics page
 * @returns {string} The formatted lyrics in a HTML string
 */
async function formatAZLyrics(path) {

  try {
    const urlAZLyrics = 'https://www.azlyrics.com/lyrics/';
    const htmlRaw = await getHtml(urlAZLyrics + path);

    const lyrics = htmlRaw
      .split('<div>')[1]
      .split('</div>')[0]
      .split('<!-- Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that. -->')[1]
      .replace(/\n/g, '')
      .trim();

    return { success: true, html: lyrics, href: urlAZLyrics + path };

  } catch (error) {
    return { success: false, html: '<p class=error>Could not find lyrics<p/>', href: null }
  }
}

/**
 * Formats scraped HTML to pure lyrics HTML from lyrics.wikia.com
 * @param {string} url The URL to a lyrics page
 * @returns {string} The formatted lyrics in a HTML string
 */
async function formatLyricWiki(path) {
  try {
    const urlLyricWiki = 'http://lyrics.wikia.com/wiki/';
    const htmlRaw = await getHtml(urlLyricWiki + path);

    const lyricsCharCode = htmlRaw
      .split('<div class=\'lyricbox\'>')[1]
      .split('<div class=\'lyricsbreak\'>')[0]
      .trim()

    const lyricsCharCodeSplit = lyricsCharCode
      .replace(/&#/g, '')
      .replace(/<br \/>/g, '<br/>')
      .replace(/<br\/><br\/>/g, '<br/>')
      // .replace(/<br>/g, '')
      .trim()
      .split(';');

    let lyrics = '';
    lyricsCharCodeSplit.forEach(charCode => {
      if (/^\d+$/.test(charCode)) {
        lyrics += String.fromCharCode(charCode);
      } else if (/<br\/>/.test(charCode)) {
        lyrics += '<br>' + String.fromCharCode(charCode.replace(/<br\/>/, ''))
      }
    })

    return { success: true, html: lyrics, href: urlLyricWiki + path };

  } catch (error) {
    return { success: false, html: '<p class=error>Could not find lyrics<p/>', href: null }
  }
}

/**
 * Formats scraped HTML to pure lyrics HTML from genius.com
 * @param {string} url The URL to a lyrics page
 * @returns {string} The formatted lyrics in a HTML string
 */
async function formatGenious(url) {
  try {
    const urlGenius = 'https://genius.com/';
    const htmlRaw = await getHtml(urlGenius + url);

    const lyrics = htmlRaw
      .split('<p>')[1]
      .split('</p>')[0]
      .replace(/\n/g, '')
      //.replace(/<a(\s[^>]*)?>.*?<\/a>/ig, '')
      .trim();

    return { success: true, html: lyrics, href: urlGenius + url };

  } catch (error) {
    return { success: false, html: '<p class=error>Could not find lyrics<p/>', href: null }
  }
}

/**
 * Gets all lyrics from azlyrics.com, genius.com and lyrics.wikia.com
 * @param {string} artist The artist
 * @param {string} track The track
 * @returns {object} All three lyrics data in an object
 */
async function getLyrics(artist, track) {
  const paths = getPathsArtistTrack(artist, track)

  let lyrics = {};
  lyrics.artist = artist;
  lyrics.track = track;
  lyrics.azlyric = await formatAZLyrics(paths.azlyric);
  lyrics.lyricwiki = await formatLyricWiki(paths.lyricwiki);
  lyrics.genius = await formatGenious(paths.genius);

  return lyrics;
}

module.exports.getLyrics = getLyrics;