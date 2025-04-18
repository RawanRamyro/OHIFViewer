import { ServicesManager} from "@ohif/core";

export default function (wadoRoot, servicesManager) {
  return {
    series: (StudyInstanceUID, SeriesInstanceUID) => {
      return new Promise((resolve, reject) => {
        // Reject because of Quality. (Seems the most sensible out of the options)
        const CodeValueAndCodeSchemeDesignator = `113001%5EDCM`;

        const url = `${wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/reject/${CodeValueAndCodeSchemeDesignator}`;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);

        // Get auth headers from userAuthenticationService
        const authHeaders = servicesManager.services.userAuthenticationService.getAuthorizationHeader();
        
        // Add Authorization header if available
        if (authHeaders && authHeaders.Authorization) {
          xhr.setRequestHeader('Authorization', authHeaders.Authorization);
          console.log('Added Authorization header:', authHeaders.Authorization);
        } else {
          console.log('No Authorization header available');
        }
        
        // Set content type header
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        console.log('Sending request to:', url);

        xhr.onreadystatechange = function () {
          // Call a function when the state changes
          if (xhr.readyState == 4) {
            console.log('Response status:', xhr.status);
            
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
        
        // Add error handling for network issues
        xhr.onerror = function() {
          console.error('Network error occurred during series rejection');
          reject('Network error occurred. Please check your connection.');
        };
        
        xhr.send();
      });
    },
  };
}