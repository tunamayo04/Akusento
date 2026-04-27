function containsJapanese(text) {
  const regex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g;
  return regex.test(text);
}

function removeFurigana() {
  let furigana = document.getElementsByTagName('rt');

  if (furigana.length === 0) return;

  while (furigana[0]) furigana[0].remove();
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

function tagWordAccent(word) {
  let dictEntry =
    getDictionnaryEntryFromKanji(word) || getDictionnaryEntryFromPronunciation(word);

  if (dictEntry) {
    var pitchMora = dictEntry.pitchMora[0][0];
    return `<span class="${getPitchPattern(pitchMora, dictEntry.pronunciation.length)}">${word}</span>`;
  } else {
    return word;
  }
}

function markTextAccents() {
  let paragraphs = document.getElementsByTagName('p');

  for (var i = 0; i < paragraphs.length; i++) {
    let tokens = tokenize(paragraphs[i].textContent);

    let newHtml = '';
    for (var j = 0; j < tokens.length; j++) {
      if (tokens[j][1].startsWith('N')) newHtml += tagWordAccent(tokens[j][0]);
      else newHtml += tokens[j][0];
    }

    paragraphs[i].innerHTML = newHtml;
  }
}

function removeTextAccents() {
  let colored = document.querySelectorAll('.heiban, .atamadaka, .nakadaka, .odaka, .kifuku');

  for (var i = 0; i < colored.length; i++) {
    colored[i].classList.remove('heiban');
    colored[i].classList.remove('atamadaka');
    colored[i].classList.remove('nakadaka');
    colored[i].classList.remove('odaka');
    colored[i].classList.remove('kifuku');
  }
}

// MV3: Scripts are injected fresh each time, so read current storage state
// immediately on injection rather than relying on onChanged events alone.
chrome.storage.sync.get('showAccents', (result) => {
  if (result.showAccents === true) {
    removeFurigana();
    markTextAccents();
  } else {
    removeTextAccents();
  }
});

// Still listen for changes that happen while the page is open
chrome.storage.onChanged.addListener(function (changes) {
  if ('showAccents' in changes) {
    if (changes.showAccents.newValue === true) {
      removeFurigana();
      markTextAccents();
    } else {
      removeTextAccents();
    }
  }
});
