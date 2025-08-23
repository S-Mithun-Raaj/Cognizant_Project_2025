Virtual AI Clinician – A Medical Chat Assistant:
- The frontend of the web app is created using Next.js.
- The working of the application depends on two main components: the AI model and the Frame-Based Dialogue System.

AI Model:
The AI model is built using Python and consists of two main parts:
1. Storing and retrieving the input dataset (a medical PDF in our case) as vector representations.
2. Generating human-like responses for given user queries.

Vector Database:
- We use Pinecone Vector Database to store and retrieve data using a Pinecone key. This database enables similarity-based vector search and returns the top n related vectors for a given query.

Model:
- The model is powered by the DeepSeek LLM, imported from Hugging Face.
- We implement prompt engineering by passing the history (only the last x conversations) to the model, which significantly improves its performance.

RestAPI:
- To temporarily run the program for research purposes, we needed access to GPU resources, so we used Kaggle for execution.
- To host the model and make it accessible via REST API, we used Ngrok and Uvicorn to create a temporary URL that points to the model running on Kaggle.

Frame-Based Dialogue System:
- The Frame-Based Dialogue System is implemented directly in the JavaScript file of the chatbot page.
- A dictionary-based approach is used with predefined logic to acquire structured user input like name, age, problem, etc.

Requirements:
fastapi
uvicorn
langchain
langchain-community
pinecone
langchain_pinecone
transformers
torch
sentence-transformers
langchain-pinecone
accelerate>=0.26.0

Team:
Revanth JR
Mithun Raaj S
Prasenna Vignesh V
Aravindh M
