import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from tickets.models import Ticket

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_pipeline', 'saved_models')

_category_model = None
_priority_model = None

def get_category_model():
    global _category_model
    if _category_model is None:
        model_path = os.path.join(MODELS_DIR, 'category_model.pkl')
        if os.path.exists(model_path):
            _category_model = joblib.load(model_path)
    return _category_model

def get_priority_model():
    global _priority_model
    if _priority_model is None:
        model_path = os.path.join(MODELS_DIR, 'priority_model.pkl')
        if os.path.exists(model_path):
            _priority_model = joblib.load(model_path)
    return _priority_model

def predict_category(description: str) -> str:
    model = get_category_model()
    if model:
        prediction = model.predict([description])
        return prediction[0]
    return 'Inquiry' # Default fallback

def predict_priority(description: str) -> str:
    model = get_priority_model()
    if model:
        prediction = model.predict([description])
        return prediction[0]
    return 'Medium' # Default fallback

def find_duplicate(description: str, threshold: float = 0.85):
    """
    Finds duplicate tickets among Open/In Progress tickets based on description cosine similarity.
    """
    open_tickets = Ticket.objects.filter(status__in=['Open', 'In Progress'])
    if not open_tickets.exists():
        return None
        
    documents = [t.description for t in open_tickets]
    documents.append(description) # target description is last
    
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform(documents)
        # Cosine similarity of the target against all others
        cosine_sim = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
        
        best_match_idx = cosine_sim.argmax()
        best_score = cosine_sim[best_match_idx]
        
        if best_score >= threshold:
            # We return the dictionary data for the API
            duplicate_ticket = open_tickets[int(best_match_idx)]
            return {
                'is_duplicate': True,
                'similarity_score': best_score,
                'duplicate_of': str(duplicate_ticket.id),
                'duplicate_title': duplicate_ticket.title
            }
    except ValueError:
        # Happens if descriptions are completely empty or stop-words only
        pass
        
    return None
