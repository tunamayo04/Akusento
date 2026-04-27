function containsJapanese(text) {
  const regex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g;
  return regex.test(text);
}

function getDictionnaryEntryFromKanji(word) {
  let entry = dict.find((entry) => entry.kanji === word);
  return entry ? entry : null;
}

function getDictionnaryEntryFromPronunciation(word) {
  let entry = dict.find((entry) => entry.pronunciation === word);
  return entry ? entry : null;
}

function getPitchPattern(pitchMora, wordLength) {
  if (pitchMora === 0) return 'heiban';
  else if (pitchMora === 1) return 'atamadaka';
  else if (pitchMora === wordLength) return 'odaka';
  else return 'nakadaka';
}

function getAccentSpan(word) {
  let dictEntry =
    getDictionnaryEntryFromKanji(word) || getDictionnaryEntryFromPronunciation(word);

  if (dictEntry) {
    const pitchMora = dictEntry.pitchMora[0][0];
    const span = document.createElement('span');
    span.className = getPitchPattern(pitchMora, dictEntry.pronunciation.length);
    span.textContent = word;
    return span;
  }
  return null;
}

function isInsideAccentSpan(node) {
  let current = node.parentElement;
  while (current) {
    if (
      current.tagName === 'SPAN' &&
      (current.classList.contains('heiban') ||
        current.classList.contains('atamadaka') ||
        current.classList.contains('nakadaka') ||
        current.classList.contains('odaka') ||
        current.classList.contains('kifuku'))
    )
      return true;
    current = current.parentElement;
  }
  return false;
}

function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.parentElement && node.parentElement.closest('rt')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (isInsideAccentSpan(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  return textNodes;
}

function processTextNode(textNode) {
  const text = textNode.textContent;
  if (!containsJapanese(text)) return;

  const tokens = tokenize(text);
  if (!tokens || tokens.length === 0) return;

  const fragment = document.createDocumentFragment();
  let changed = false;

  for (const token of tokens) {
    const [word, pos] = token;

    if (pos && pos.startsWith('N')) {
      const span = getAccentSpan(word);
      if (span) {
        fragment.appendChild(span);
        changed = true;
        continue;
      }
    }

    fragment.appendChild(document.createTextNode(word));
  }

  if (changed) {
    textNode.parentNode.replaceChild(fragment, textNode);
  }
}

function markTextAccents() {
  const paragraphs = document.getElementsByTagName('p');

  for (const paragraph of paragraphs) {
    const textNodes = getTextNodes(paragraph);
    for (const textNode of textNodes) {
      processTextNode(textNode);
    }
  }
}

function removeTextAccents() {
  const colored = document.querySelectorAll('.heiban, .atamadaka, .nakadaka, .odaka, .kifuku');

  for (const el of colored) {
    el.replaceWith(document.createTextNode(el.textContent));
  }
}

chrome.storage.sync.get('showAccents', (result) => {
  if (result.showAccents === true) {
    markTextAccents();
  } else {
    removeTextAccents();
  }
});

chrome.storage.onChanged.addListener(function (changes) {
  if ('showAccents' in changes) {
    if (changes.showAccents.newValue === true) {
      markTextAccents();
    } else {
      removeTextAccents();
    }
  }
});
