chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if media exists in the Plex library.
  if (request.action === 'checkLibrary') {
    chrome.storage.local.get(['plexToken', 'plexServerUrl'], (result) => {
      if (!result.plexToken || !result.plexServerUrl) {
        sendResponse({ error: 'Not authenticated or Plex server not selected.' });
        return;
      }
      // Use the selected Plex server’s search endpoint.
      // (Adjust the endpoint if your server uses a different path.)
      const serverUrl = result.plexServerUrl.replace(/\/$/, '');
      const url = `${serverUrl}/search?query=${encodeURIComponent(request.mediaTitle)}`;
      fetch(url, {
        headers: {
          'X-Plex-Token': result.plexToken,
          'X-Plex-Client-Identifier': 'PlexRequestHub',
          'X-Plex-Platform': 'Chrome',
          'X-Plex-Product': 'Plex Request Hub'
        }
      })
        .then(response => response.json())
        .then(data => {
          // Assume the API returns an array of media objects.
          // Check for an exact (case‑insensitive) title match.
          const exists = data && data.results && data.results.some(item =>
            item.title && item.title.toLowerCase() === request.mediaTitle.toLowerCase()
          );
          sendResponse({ exists });
        })
        .catch(error => {
          console.error('Error checking Plex library:', error);
          sendResponse({ error: error.message });
        });
    });
    return true; // Async response.
  }

  // Request media via Overseerr.
  if (request.action === 'requestMedia') {
    chrome.storage.local.get(['overseerrHost', 'overseerrApiKey'], (result) => {
      if (!result.overseerrHost || !result.overseerrApiKey) {
        sendResponse({ success: false, error: "Overseerr configuration missing. Please set it up in Options." });
        return;
      }
      // Search for the media in Overseerr.
      const searchUrl = `${result.overseerrHost}/api/v1/search?query=${encodeURIComponent(request.mediaTitle)}`;
      fetch(searchUrl, {
        headers: {
          "X-Api-Key": result.overseerrApiKey,
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(data => {
          // Assume data is an array of media objects.
          const match = data.find(item =>
            item.title && item.title.toLowerCase() === request.mediaTitle.toLowerCase()
          );
          if (!match) {
            sendResponse({ success: false, error: "Media not found in Overseerr." });
          } else {
            // Send a request for the media.
            const requestUrl = `${result.overseerrHost}/api/v1/request`;
            const payload = {
              mediaId: match.id,
              mediaType: match.mediaType || "movie"
            };
            fetch(requestUrl, {
              method: 'POST',
              headers: {
                "X-Api-Key": result.overseerrApiKey,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            })
              .then(response => response.json())
              .then(data => {
                sendResponse({ success: true, data });
              })
              .catch(error => {
                console.error('Error requesting media:', error);
                sendResponse({ success: false, error: error.message });
              });
          }
        })
        .catch(error => {
          console.error('Error searching Overseerr:', error);
          sendResponse({ success: false, error: error.message });
        });
    });
    return true;
  }
});
