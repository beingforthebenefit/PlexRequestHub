document.getElementById('signInBtn').addEventListener('click', () => {
  const redirectUri = chrome.identity.getRedirectURL();
  // Replace with your Plex client ID if available.
  const clientId = 'YOUR_CLIENT_ID';
  const plexAuthUrl = `https://app.plex.tv/auth/signin?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token`;

  chrome.identity.launchWebAuthFlow({
    url: plexAuthUrl,
    interactive: true
  }, (redirectUrl) => {
    if (chrome.runtime.lastError || !redirectUrl) {
      alert('Authentication failed. Please try again.');
      return;
    }

    // Expect token in URL fragment.
    const fragment = redirectUrl.split('#')[1];
    const params = new URLSearchParams(fragment);
    const token = params.get('access_token');

    if (token) {
      chrome.storage.local.set({ plexToken: token }, () => {
        // Now enumerate the Plex servers.
        fetch('https://plex.tv/api/resources?includeHttps=1', {
          headers: { 'X-Plex-Token': token }
        })
          .then(response => response.text())
          .then(text => {
            // Parse XML response.
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const devices = Array.from(xmlDoc.getElementsByTagName('Device'));
            // Filter devices that provide a server.
            const servers = devices.filter(device => {
              const provides = device.getAttribute('provides');
              return provides && provides.split(',').includes('server');
            }).map(device => {
              const name = device.getAttribute('name');
              // Get the first Connection element.
              const connElem = device.getElementsByTagName('Connection')[0];
              const uri = connElem ? connElem.getAttribute('uri') : null;
              return { name, uri };
            }).filter(s => s.uri);

            if (servers.length === 0) {
              alert('No Plex servers found for this account.');
              return;
            }

            // Render the server dropdown.
            const dropdown = document.getElementById('plexServerDropdown');
            dropdown.innerHTML = '';
            servers.forEach(server => {
              const option = document.createElement('option');
              option.value = server.uri;
              option.textContent = server.name;
              dropdown.appendChild(option);
            });
            document.getElementById('serverSelection').style.display = 'block';
          })
          .catch(error => {
            console.error('Error fetching Plex resources:', error);
            alert('Failed to retrieve Plex servers.');
          });
      });
    } else {
      alert('Authentication failed. No token received.');
    }
  });
});

// Save the selected server.
document.getElementById('saveServerBtn').addEventListener('click', () => {
  const dropdown = document.getElementById('plexServerDropdown');
  const selectedUri = dropdown.value;
  if (selectedUri) {
    chrome.storage.local.set({ plexServerUrl: selectedUri }, () => {
      alert('Plex server saved! You can now close this popup.');
    });
  }
});
