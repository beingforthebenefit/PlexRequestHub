function injectMediaStatus() {
  if (document.getElementById('plexRequestHubContainer')) return;

  const container = document.createElement('div');
  container.id = 'plexRequestHubContainer';
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.zIndex = 10000;
  container.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  container.style.border = '1px solid #ccc';
  container.style.borderRadius = '4px';
  container.style.padding = '10px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';

  const statusSpan = document.createElement('span');
  statusSpan.id = 'plexStatus';
  statusSpan.textContent = 'Checking Plex library...';
  container.appendChild(statusSpan);

  const spacer = document.createElement('div');
  spacer.style.height = '8px';
  container.appendChild(spacer);

  const requestBtn = document.createElement('button');
  requestBtn.id = 'overseerrRequestBtn';
  requestBtn.textContent = 'Request on Overseerr';
  requestBtn.style.display = 'none';
  requestBtn.style.padding = '5px 10px';
  requestBtn.style.border = 'none';
  requestBtn.style.borderRadius = '3px';
  requestBtn.style.cursor = 'pointer';
  requestBtn.style.backgroundColor = '#007bff';
  requestBtn.style.color = '#fff';
  container.appendChild(requestBtn);

  document.body.appendChild(container);

  // Extract media title (from an <h1> or fallback to document title)
  let mediaTitle = document.querySelector('h1')
    ? document.querySelector('h1').innerText.trim()
    : document.title;

  chrome.runtime.sendMessage({ action: 'checkLibrary', mediaTitle }, (response) => {
    if (response && response.error) {
      statusSpan.textContent = 'Plex status: Error';
      statusSpan.style.color = 'orange';
    } else if (response && response.exists) {
      statusSpan.textContent = 'In Plex Library ✅';
      statusSpan.style.color = 'green';
    } else {
      statusSpan.textContent = 'Not in Plex Library ❌';
      statusSpan.style.color = 'red';
      requestBtn.style.display = 'inline-block';
    }
  });

  requestBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'requestMedia', mediaTitle }, (response) => {
      if (response && response.success) {
        alert(`Request sent for "${mediaTitle}" via Overseerr.`);
        requestBtn.disabled = true;
        requestBtn.textContent = 'Requested';
      } else {
        alert(`Request failed: ${response ? response.error : 'Unknown error'}`);
      }
    });
  });
}

window.addEventListener('load', injectMediaStatus);
