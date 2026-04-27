let isOn = false;

chrome.storage.sync.set({ showAccents: false });

const setListeners = () => {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    toggleAccentsOnTab(activeInfo.tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      toggleAccentsOnTab(tabId);
    }
  });

  chrome.action.onClicked.addListener(() => {
    isOn = !isOn;

    chrome.storage.sync.set({ showAccents: isOn });

    setBadge();
    toggleAccentsOnAllTabs();
  });
};

const setBadge = () => {
  const text = isOn ? 'ON' : '';
  chrome.action.setBadgeBackgroundColor({ color: '#f24438' });
  chrome.action.setBadgeText({ text });
};

const loadDependencies = (id) => {
  // MV3: use chrome.scripting.executeScript with files array
  const files = [
    'rakutenma/rakutenma.js',
    'rakutenma/model_ja.js',
    'rakutenma/hanzenkaku.js',
    'data/dict.js',
    'src/tokenizer.js',
    'src/akusento.js',
  ];

  // Scripts must be injected sequentially to respect load order
  const injectSequentially = async (files) => {
    // Inject CSS first
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: id },
        files: ['src/pitch_color.css'],
      });
    } catch (err) {
      console.log('Error injecting pitch_color.css:', err.message);
    }

    // Then inject JS files in order
    for (const file of files) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: id },
          files: [file],
        });
      } catch (err) {
        console.log(`Error injecting ${file}:`, err.message);
      }
    }
  };

  injectSequentially(files);
};

const toggleAccentsOnAllTabs = () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      toggleAccentsOnTab(tab.id);
    });
  });
};

const toggleAccentsOnTab = (id) => {
  if (isOn) {
    loadDependencies(id);
  }
};

setListeners();
