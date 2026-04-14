import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

def train_models():
    if not os.path.exists('synthetic_tickets.csv'):
        print("Dataset not found. Please run generate_dataset.py first.")
        return
        
    df = pd.read_csv('synthetic_tickets.csv')
    
    # Classification Model (Category Prediction)
    X = df['description']
    y_cat = df['category']
    
    cat_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=1000)),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X, y_cat, test_size=0.2, random_state=42)
    cat_pipeline.fit(X_train_c, y_train_c)
    cat_acc = cat_pipeline.score(X_test_c, y_test_c)
    print(f"Category Model Accuracy: {cat_acc:.2f}")
    
    # Priority Prediction Model
    y_prio = df['priority']
    
    prio_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=1000)),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])
    
    X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(X, y_prio, test_size=0.2, random_state=42)
    prio_pipeline.fit(X_train_p, y_train_p)
    prio_acc = prio_pipeline.score(X_test_p, y_test_p)
    print(f"Priority Model Accuracy: {prio_acc:.2f}")
    
    os.makedirs('saved_models', exist_ok=True)
    joblib.dump(cat_pipeline, 'saved_models/category_model.pkl')
    joblib.dump(prio_pipeline, 'saved_models/priority_model.pkl')
    print("Models saved successfully in 'saved_models' directory.")

if __name__ == '__main__':
    train_models()
