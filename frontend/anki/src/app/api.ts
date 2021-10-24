import {
  Word,
  Sentence,
  SentencesResult,
  sourceForSentence,
  sentenceWithFocusWord,
} from '@app/domain'

interface JishoResult {
  word: string
  definitions: Definition[]
}

interface GooResult {
  word: string
  definition: string
  reading: string
}

interface Definition {
  meaning: string
}

const root = 'http://localhost:5555'

export const getJishoDefinition = async (
  word: string,
): Promise<JishoResult> => {
  const url = `${root}/jisho/${encodeURI(word)}`
  const response = await fetch(url)
  const body = await response.json()

  return body
}

export const getSentences = async (word: string): Promise<SentencesResult> => {
  const url = `${root}/corpus/${encodeURI(word)}`
  const response = await fetch(url)
  const body = await response.json()

  const sentences = body.results.map((s: Sentence) => ({
    ...s,
    line: s.line.trim(),
    original: s.line.trim(),
  }))

  sentences.sort((a: Sentence, b: Sentence) => {
    if (a.line.length > b.line.length) {
      return 1
    }
    if (a.line.length < b.line.length) {
      return -1
    }
    return 0
  })

  return {
    results: sentences,
  }
}

export const getGooDefinition = async (word: string): Promise<GooResult> => {
  const url = `${root}/goo/${encodeURI(word)}`
  const response = await fetch(url)
  const body = await response.json()

  return body
}

export const addAnkiNote = async (word: Word): Promise<any> => {
  const deckName = '3. Japanese::3. Vocab'
  const request = {
    action: 'addNote',
    version: 6,
    params: {
      note: {
        deckName,
        modelName: 'ankiminer_jp',
        fields: {
          Expression: sentenceWithFocusWord(word),
          Focus: word.value,
          Reading: word.meta.reading,
          EnglishDefinition: word.meta.definitionEnglish,
          JapaneseDefinition: word.meta.definitionJapanese,
          VocabOnlyCard: word.meta.vocabCard ? '1' : '',
          Source: sourceForSentence(word.meta.sentence),
        },
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck',
          duplicateScopeOptions: {
            deckName,
            checkChildren: false,
            checkAllModels: false,
          },
        },
        tags: [
          'ankiminer',
          'japanese',
          'mined',
          'native',
          word.meta.sentence?.series,
        ].filter(t => t !== undefined),
      },
    },
  }

  const url = 'http://127.0.0.1:8765'
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(request),
  })
  const body = await response.json()

  return body
}
