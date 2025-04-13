from modules.stt_module import speech_to_text

audio_path = "sample audio.mp3"

if __name__ == "__main__":
    try:
        print("Running Speech-to-Text...")
        result = speech_to_text(audio_path)
        print("Transcription:\n", result)
    except Exception as e:
        print("Error:", e)
