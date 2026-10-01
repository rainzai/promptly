import os
import requests
from dotenv import load_dotenv

load_dotenv()

# test api
resp = requests.get(
    "https://llmproxy.uva.nl/v1/models",
    headers={"x-litellm-api-key": os.environ["LLM_API_KEY"]},
)

print("Status:", resp.status_code)
resp.raise_for_status()

for model in resp.json()["data"]:
    print(model["id"])
