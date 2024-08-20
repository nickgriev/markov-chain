// Markov chain implementation
// Idea is to generate a random sequence of words based on the frequency of words in the input text
// We will look at previous words and generate the next word based on the frequency of the next word in the learned text

import { readdir } from 'node:fs/promises';

console.log('Markov chain text generator');

const OUTPUT_LENGHT = 60;
const ARE_TRIGRAMS_ENABLED = false;

console.log('Reading files to train on...');

const filesToTrainOn = [];
const fileNamesToTrainOn = await readdir('./texts', { withFileTypes: true });
for (const file of fileNamesToTrainOn) {
  if (file.isFile() && !file.name.startsWith('_')) {
    filesToTrainOn.push(file.name);
  }
}

if (!filesToTrainOn.length) {
  console.error('No files to train on');
  process.exit(1);
}

const trainingFiles = filesToTrainOn.map((fileName) =>
  Bun.file('./texts/' + fileName)
);

let trainingText = '';
for (const file of trainingFiles) {
  trainingText += await file.text();
}

console.log('Training on text...');

const words = trainingText
  .split(/[\s\n\r]/)
  .filter((word) => word.length > 0)
  .map((word) => word.replace(/[\(\)]/g, ''));

const unigrams: Map<string, string[]> = new Map();
const bigrams: Map<string, string[]> = new Map();
const trigrams: Map<string, string[]> = new Map();

console.log('Learning...');

for (let i = 0; i < words.length; i++) {
  const word = words[i];

  if (i < words.length - 1) {
    const nextWord = words[i + 1];
    if (!unigrams.has(word)) {
      unigrams.set(word, []);
    }
    unigrams.get(word)!.push(nextWord);
  }

  if (i < words.length - 2) {
    const nextWord = words[i + 1];
    const nextNextWord = words[i + 2];
    if (!bigrams.has(word + ' ' + nextWord)) {
      bigrams.set(word + ' ' + nextWord, []);
    }
    bigrams.get(word + ' ' + nextWord)!.push(nextNextWord);
  }

  if (ARE_TRIGRAMS_ENABLED && i < words.length - 3) {
    const nextWord = words[i + 1];
    const nextNextWord = words[i + 2];
    const nextNextNextWord = words[i + 3];
    if (!trigrams.has(word + ' ' + nextWord + ' ' + nextNextWord)) {
      trigrams.set(word + ' ' + nextWord + ' ' + nextNextWord, []);
    }
    trigrams
      .get(word + ' ' + nextWord + ' ' + nextNextWord)!
      .push(nextNextNextWord);
  }
}

function writeText() {
  console.log();
  console.log('Generating text...');
  console.log();
  const text: string[] = [];

  text.push(words[Math.floor(Math.random() * words.length)]);

  for (let i = 0; i < OUTPUT_LENGHT; i++) {
    const lastWord = text[text.length - 1];
    const lastTwoWords = text.slice(-2).join(' ');
    const lastThreeWords = text.slice(-3).join(' ');

    if (ARE_TRIGRAMS_ENABLED && trigrams.has(lastThreeWords)) {
      const nextWord =
        trigrams.get(lastThreeWords)![
          Math.floor(Math.random() * trigrams.get(lastThreeWords)!.length)
        ];
      text.push(nextWord);
    } else if (bigrams.has(lastTwoWords)) {
      const nextWord =
        bigrams.get(lastTwoWords)![
          Math.floor(Math.random() * bigrams.get(lastTwoWords)!.length)
        ];
      text.push(nextWord);
    } else if (unigrams.has(lastWord)) {
      const nextWord =
        unigrams.get(lastWord)![
          Math.floor(Math.random() * unigrams.get(lastWord)!.length)
        ];
      text.push(nextWord);
    } else {
      text.push(words[Math.floor(Math.random() * words.length)]);
    }
  }

  for (let i = 0; i < text.length; i++) {
    if (i === 0) {
      text[i] = text[i].charAt(0).toUpperCase() + text[i].slice(1);
    }
    if (i > 0) {
      const lastWord = text[i - 1];
      if (
        lastWord.endsWith('.') ||
        lastWord.endsWith('!') ||
        lastWord.endsWith('?') ||
        lastWord.endsWith('"') ||
        lastWord.endsWith('”')
      ) {
        text[i] = text[i].charAt(0).toUpperCase() + text[i].slice(1);
      }
    }
  }

  if (
    !text[text.length - 1].endsWith('.') &&
    !text[text.length - 1].endsWith('!') &&
    !text[text.length - 1].endsWith('?')
  ) {
    text[text.length - 1] += '...';
  }

  const textString = text.join(' ');

  console.log(textString);
  console.log();
  console.log('Press any key to generate another text or q to quit');
}

writeText();

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (data) => {
  // quit on q
  if (data.toString().trim() === 'q') {
    process.exit();
  }
  writeText();
});
