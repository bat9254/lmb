import requests
import json
import os

def transform_model_name(name):
    name = name.lower()

    # Hardcoded special cases
    if "reve image" in name or "halfmoon" in name:
        return "reve"
    if "imagen 3" in name and "v002" in name:
        return "imagen-3-generate-002"

    # Replace dots with hyphens in version numbers
    name = name.replace("x1", "x 1")
    name = name.replace("x.1", "x 1")

    # Handle bracketed suffixes
    name = name.replace("[pro]", "-pro")
    name = name.replace("[dev]", "-dev")
    name = name.replace("[schnell]", "-schnell")

    # Handle parentheses
    name = name.replace("(beta)", "")
    name = name.replace("(standard)", "")

    # Replace 'v' followed by a number
    name = name.replace("v1", "1")
    name = name.replace("v2", "2")
    name = name.replace("v3", "3")
    name = name.replace("v6", "6")

    # Clean up .0s
    name = name.replace(".0", "")

    # Replace spaces with hyphens
    name = name.replace(" ", "-")

    # Clean up multiple hyphens
    while "--" in name:
        name = name.replace("--", "-")

    # Remove trailing hyphens
    name = name.rstrip("-")

    return name

# Fetch and transform the data
url = "https://artificialanalysis.ai/api/text-to-image/arena/preferences/retrieve?user_key=total"
response = requests.get(url)
data = response.json()

# Initialize the output structure
output = {
    "full": {
        "elo_rating_final": {},
        "confidence_intervals": {}
    }
}

# Extract and transform the data
for result in data.get("results", []):
    model_name = result.get("name", "")
    elo_rating = result.get("quality_elo", 0)

    if model_name:
        transformed_name = transform_model_name(model_name)
        output["full"]["elo_rating_final"][transformed_name] = elo_rating

# Ensure directory exists
os.makedirs("src/routes/assets", exist_ok=True)

# Write to file
with open("src/routes/assets/image_artificial.json", "w") as f:
    json.dump(output, f, indent=2)
