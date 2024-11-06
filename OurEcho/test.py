import json

def load_sample_data():
    """
    Load and parse the data from sample_data.txt.
    """
    with open('sample_data.txt', 'r') as f:
        # Read and parse the stored data
        data = json.load(f)
        
        # The base64Audio might include "data:audio/ogg;base64," prefix, so we need to remove that
        if "base64Audio" in data:
            data["base64Audio"] = data["base64Audio"].split(",")[1]  # Extract actual base64 content

    return data

def test_lambda_tts():
    """
    Test the Lambda TTS function using data from sample_data.txt.
    """
    # Load sample data from the file
    sample_data = load_sample_data()

    # Import the Lambda TTS function
    import GetScore as ls

    # Convert the data to the structure expected by the Lambda function
    lambda_event = {
        "body": json.dumps(sample_data)  # JSON string of the sample data
    }

    # Invoke the Lambda function
    lambda_correct_output = ls.lambda_handler(lambda_event)  # Second argument is usually context (can pass None)

    # Print the response for debugging purposes
    print("Lambda TTS Function Response:", lambda_correct_output)

if __name__ == '__main__':
    # Run the test function
    test_lambda_tts()