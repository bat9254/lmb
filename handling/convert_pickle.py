import pickle
import json
import numpy as np
import pandas as pd
import requests
from datetime import datetime
import io
import re

def get_latest_pickle_file():
    """Fetch the latest pickle file from HuggingFace repository."""
    api_url = "https://huggingface.co/api/spaces/lmarena-ai/chatbot-arena-leaderboard/tree/main"

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        files = response.json()

        # Filter for pickle files and extract dates
        pickle_files = []
        for file in files:
            if match := re.match(r'elo_results_(\d{8})\.pkl', file['path']):
                date_str = match.group(1)
                date = datetime.strptime(date_str, '%Y%m%d')
                pickle_files.append((date, file['path']))

        if not pickle_files:
            raise Exception("No pickle files found in repository")

        # Get the most recent file
        latest_file = max(pickle_files, key=lambda x: x[0])[1]

        # Download the file content
        raw_url = f"https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/{latest_file}"
        response = requests.get(raw_url)
        response.raise_for_status()

        return pickle.loads(response.content)

    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def convert_to_serializable(obj):
    """Convert numpy/pandas objects to JSON serializable types."""
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return [convert_to_serializable(x) for x in obj.tolist()]
    elif isinstance(obj, (pd.DataFrame, pd.Series)):
        return convert_to_serializable(obj.to_dict())
    elif isinstance(obj, dict):
        return {str(k): convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_serializable(x) for x in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    return "..."

def calculate_confidence_intervals(samples):
    """Calculate 95% confidence intervals from bootstrap samples."""
    if not samples or len(samples) == 0:
        return None, None

    sorted_samples = sorted(samples)
    n = len(sorted_samples)
    low_idx = int(n * 0.025)
    high_idx = int(n * 0.975)
    return sorted_samples[low_idx], sorted_samples[high_idx]

"""Convert pickle file to JSON, handling numpy and pandas objects."""
data = get_latest_pickle_file()
if data is None:
    print("Failed to fetch data")
    exit()

processed_data = {}

# Process each category (text/vision)
for category_type, categories in data.items():
    processed_data[category_type] = {}

    # Process each subcategory (full, english, etc)
    for category_name, category_data in categories.items():
        processed_data[category_type][category_name] = {
            'elo_rating_final': {},
            'confidence_intervals': {}
        }

        # Process ratings and bootstrap data together
        if 'elo_rating_final' in category_data and 'bootstrap_df' in category_data:
            df = category_data['bootstrap_df']

            for model, rating in category_data['elo_rating_final'].items():
                rating = float(rating)
                processed_data[category_type][category_name]['elo_rating_final'][model] = round(rating, 2)

                if model in df.columns:
                    samples = df[model].astype(float).tolist()
                    ci_low, ci_high = calculate_confidence_intervals(samples)
                    if ci_low is not None and ci_high is not None:
                        processed_data[category_type][category_name]['confidence_intervals'][model] = {
                            'low': round(ci_low, 2),
                            'high': round(ci_high, 2)
                        }

with open('src/assets/results.json', 'w') as f:
    json.dump(processed_data, f)
