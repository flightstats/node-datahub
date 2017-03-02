export const isString = (o) => (typeof(o) === 'string' || Object.toString(o) === '[Object String]');

export const sanitizeURL = (url) => {
  url = url || '';
  url = url.toLowerCase();
  if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
    url = `http://${url}`;
  }
  return url;
}
