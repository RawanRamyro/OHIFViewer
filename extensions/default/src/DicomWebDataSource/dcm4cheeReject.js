export default function (wadoRoot, getAuthrorizationHeader) {
  return {
    series: (StudyInstanceUID, SeriesInstanceUID) => {
      return new Promise((resolve, reject) => {
        // Reject because of Quality. (Seems the most sensible out of the options)
        const CodeValueAndCodeSchemeDesignator = `113001%5EDCM`;

        const url = `${wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/reject/${CodeValueAndCodeSchemeDesignator}`;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);

        const headers = getAuthrorizationHeader();

        for (const key in headers) {
          xhr.setRequestHeader(key, headers[key]);
        }

        //Send the proper header information along with the request
        // TODO -> Auth when we re-add authorization.

        console.log(xhr);

        xhr.onreadystatechange = function () {
          // Call a function when the state changes
          if (xhr.readyState == 4) {
            switch (xhr.status) {
              case 204:
                console.log('Series rejection successful');
                resolve(xhr.responseText);
                break;
              case 401:
                console.error('Unauthorized: Authentication failed');
                reject('Authentication failed. Please check your credentials.');
                break;
              case 403:
                console.error('Forbidden: Insufficient permissions');
                reject('You do not have permission to perform this action.');
                break;
              case 404:
                console.error('Not Found: Endpoint or resource not available');
                reject('Your dataSource does not support reject functionality');
                break;
              default:
                console.error('Rejection failed with status:', xhr.status);
                reject(`Series rejection failed with status ${xhr.status}`);
                break;
            }
          }
        };
        xhr.send();
      });
    },
  };
}
