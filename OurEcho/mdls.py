import torch
import torch.nn as nn

import pickle


import pickle
import whisper


def getASRModel(language: str) -> nn.Module:

    if language == 'en':
        model, decoder, utils = torch.hub.load(repo_or_dir='snakers4/silero-models',
                                               model='silero_stt',
                                               language='en',
                                               device=torch.device('cpu'))
    return (model, decoder)

def getModel(language: str):
    # Load the Whisper model (choose the appropriate size: base, small, medium, large)
    model = whisper.load_model("base")
    return model


def getTTSModel(language: str) -> nn.Module:


    if language == 'en':
        speaker = 'lj_16khz'  # 16 kHz
        model = torch.hub.load(repo_or_dir='snakers4/silero-models',
                               model='silero_tts',
                               language=language,
                               speaker=speaker)
    else:
        raise ValueError('Language not implemented')

    return model


def getTranslationModel(language: str) -> nn.Module:
    from transformers import AutoTokenizer
    from transformers import AutoModelForSeq2SeqLM
    if language == 'de':
        model = AutoModelForSeq2SeqLM.from_pretrained(
            "Helsinki-NLP/opus-mt-de-en")
        tokenizer = AutoTokenizer.from_pretrained(
            "Helsinki-NLP/opus-mt-de-en")
        # Cache models to avoid Hugging face processing
        with open('translation_model_de.pickle', 'wb') as handle:
            pickle.dump(model, handle)
        with open('translation_tokenizer_de.pickle', 'wb') as handle:
            pickle.dump(tokenizer, handle)
    else:
        raise ValueError('Language not implemented')

    return model, tokenizer
