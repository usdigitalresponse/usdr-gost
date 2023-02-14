var regex = ${matchRegex};

function handler(event) {
  var request = event.request;

  if (request.uri.match(regex).length > 0) {
      request.uri = '${rewriteTo}';
  }

  return request;
}
