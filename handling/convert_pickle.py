import pickle
import json
import numpy as np
import pandas as pd

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
    # return str(obj)

def convert_pickle_to_json():
    """Convert pickle file to JSON, handling numpy and pandas objects."""
    with open('handling/elo_results_20250105.pkl', 'rb') as f:
        data = pickle.load(f)

    serializable_data = convert_to_serializable(data)

    with open('src/assets/results.json', 'w') as f:
        json.dump(serializable_data, f)

convert_pickle_to_json()
