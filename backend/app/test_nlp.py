import requests  # type: ignore

def test_nlp_endpoint():
    response = requests.get("http://localhost:8000/nlp/nlp-test")
    print(response.json())

if __name__ == "__main__":
    test_nlp_endpoint()
    
