from groq import Groq
from typing import Dict



client = Groq()

def run_nlp_reasoning(prompt: str) -> Dict:
    """
    Perform NLP reasoning using Groq API with reasoning_format enabled.
    
    Args:
        prompt (str): The input string/question for NLP reasoning.

    Returns:
        Dict: The result including reasoning (if available) and final response.
    """
    try:
        response = client.chat.completions.create(
            model="deepseek-r1-distill-qwen-32b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.6,
            max_completion_tokens=1024,
            top_p=0.95,
            stream=False,
            reasoning_format="parsed"  # Options: "raw", "parsed", "hidden"
        )

        result_content = response.choices[0].message.content
        return {
            "success": True,
            "response": result_content
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
