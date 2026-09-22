from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import onnxruntime as ort
import numpy as np
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download
import fitz  # PyMuPDF
import os

app = FastAPI(title="Smart Career Portal AI Service")

# Setup model parameters
MODEL_ID = "Xenova/all-MiniLM-L6-v2"
MODEL_FILE = "onnx/model.onnx"
session = None
tokenizer = None

def load_model():
    global session, tokenizer
    try:
        print("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        
        print("Downloading/loading ONNX model...")
        model_path = hf_hub_download(repo_id=MODEL_ID, filename=MODEL_FILE)
        session = ort.InferenceSession(model_path)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.on_event("startup")
async def startup_event():
    load_model()

def get_embedding(text: str) -> np.ndarray:
    if not session or not tokenizer:
        raise ValueError("Model not loaded properly")
        
    inputs = tokenizer(text, padding=True, truncation=True, return_tensors="np")
    # Extract inputs for ONNX session
    ort_inputs = {
        "input_ids": inputs["input_ids"].astype(np.int64),
        "attention_mask": inputs["attention_mask"].astype(np.int64),
        "token_type_ids": inputs["token_type_ids"].astype(np.int64)
    }
    
    # Run inference
    ort_outs = session.run(None, ort_inputs)
    # Mean pooling (simplified for demonstration, typically you use attention mask for correct pooling)
    embeddings = ort_outs[0]
    sentence_embedding = np.mean(embeddings, axis=1)[0]
    
    # Normalize
    norm = np.linalg.norm(sentence_embedding)
    if norm > 0:
        sentence_embedding = sentence_embedding / norm
        
    return sentence_embedding

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    return float(np.dot(vec1, vec2))

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

@app.get("/api/health")
def health_check():
    return {
        "status": "ok", 
        "message": "AI microservice is running",
        "model_loaded": session is not None
    }

@app.post("/api/match")
def calculate_match(request: MatchRequest):
    try:
        resume_emb = get_embedding(request.resume_text)
        jd_emb = get_embedding(request.job_description)
        
        similarity = cosine_similarity(resume_emb, jd_emb)
        match_score = round(similarity * 100, 2)
        
        return {
            "match_score": match_score,
            "details": "Calculated using local ONNX model (all-MiniLM-L6-v2)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BulkMatchRequest(BaseModel):
    resume_text: str
    job_descriptions: list[str]

@app.post("/api/bulk-match")
def calculate_bulk_match(request: BulkMatchRequest):
    try:
        resume_emb = get_embedding(request.resume_text)
        scores = []
        for jd in request.job_descriptions:
            jd_emb = get_embedding(jd)
            similarity = cosine_similarity(resume_emb, jd_emb)
            scores.append(round(similarity * 100, 2))
        
        return {
            "match_scores": scores,
            "details": "Calculated using local ONNX model (all-MiniLM-L6-v2)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        pdf_document = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in pdf_document:
            text += page.get_text()
            
        return {"parsed_text": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

class MockInterviewRequest(BaseModel):
    resume_text: str
    job_description: str
    historical_questions: list[str]
    chat_history: list[dict] = [] # e.g. [{"role": "user", "content": "..."}, ...]

@app.post("/api/copilot/mock-interview")
async def mock_interview(request: MockInterviewRequest):
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

        # Requires GOOGLE_API_KEY environment variable to be set
        # But we will handle if it's missing gracefully
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return {"reply": "Sorry, the GOOGLE_API_KEY is not configured on the AI server."}

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=api_key)

        system_prompt = f"""You are an expert technical interviewer acting as a hiring manager.
You are interviewing a candidate for a role described as:
{request.job_description}

Here is the candidate's resume:
{request.resume_text}

Here are some questions previously asked by this company to other candidates:
{chr(10).join(request.historical_questions)}

Instructions:
1. Conduct a mock interview.
2. Ask one question at a time. Do not overwhelm the candidate.
3. Base your questions on their resume gaps relative to the job description, AND draw heavily from the historical questions.
4. Keep the tone professional but encouraging.
5. If the candidate answers, briefly evaluate their answer and ask the next question.
"""
        messages = [SystemMessage(content=system_prompt)]
        
        for msg in request.chat_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        # If there's no chat history, start the interview
        if not request.chat_history:
            messages.append(HumanMessage(content="Hello, I am ready to start the interview."))

        response = llm.invoke(messages)
        return {"reply": response.content}

    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    resume_text: str
    user_message: str
    chat_history: list[dict] = []

@app.post("/api/copilot/chat")
async def copilot_chat(request: ChatRequest):
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return {"reply": "Sorry, the GOOGLE_API_KEY is not configured on the AI server."}

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=api_key)

        system_prompt = f"""You are an AI Career Copilot for a student.
You are here to help them prepare for placements, suggest what to study, and give career advice.
Here is the student's resume:
{request.resume_text}

Instructions:
1. Provide personalized career advice based on their resume.
2. If they ask what to study for a specific role or company, identify their skill gaps based on the resume and guide them.
3. Keep your answers concise, encouraging, and highly technical.
"""
        messages = [SystemMessage(content=system_prompt)]
        
        for msg in request.chat_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=request.user_message))

        response = llm.invoke(messages)
        return {"reply": response.content}

    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
