document.getElementById('saveOptions').addEventListener('click', () => {
  const overseerrHost = document.getElementById('overseerrHost').value;
  const overseerrApiKey = document.getElementById('overseerrApiKey').value;
  chrome.storage.local.set({ overseerrHost, overseerrApiKey }, () => {
    alert('Options saved!');
  });
});

window.addEventListener('load', () => {
  chrome.storage.local.get(['overseerrHost', 'overseerrApiKey'], (data) => {
    if (data.overseerrHost) document.getElementById('overseerrHost').value = data.overseerrHost;
    if (data.overseerrApiKey) document.getElementById('overseerrApiKey').value = data.overseerrApiKey;
  });
});
