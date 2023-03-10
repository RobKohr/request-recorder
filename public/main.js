function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
function generate() {
  const channel = randomString(25, '23456789abcdefghjkmnpqrstuvwxyz');
  const baseUrl = window.location.href;
  const request = baseUrl + 'channel/' + channel;
  const log = baseUrl + 'log/' + channel;
  const requestLink = document.getElementById('request-link');
    const logLink = document.getElementById('request-log');
      const form = document.getElementById('request-form');
  requestLink.setAttribute('href', request);
    logLink.setAttribute('href', log);
    form.setAttribute('action', request);
  requestLink.innerHTML = request;
  logLink.innerHTML = log;
  document.getElementById('channel-pair').style.display = 'block';
}
