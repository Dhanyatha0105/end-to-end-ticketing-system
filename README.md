# Jira Lite: Production-Grade Ticketing System with ML

**Live demo:** https://end-to-end-ticketing-system.vercel.app — _Demo: frontend only with sample tickets, mock ML category/priority prediction &amp; duplicate detection (no live Django backend)._

Jira Lite is a scalable, modular ticketing system designed for enterprise-level support teams. It features integrated Machine Learning for automatic issue classification, priority prediction, and intelligent duplicate detection.

## 🚀 Key Features

- **Ticket Management:** Full CRUD operations with modern, responsive UI.
- **ML-Powered Classification:** Automatically predicts ticket categories (Bug, Feature, System Issue, Inquiry).
- **ML-Powered Priority:** suggests priority (Low, Medium, High, Critical) based on description and severity.
- **Duplicate Detection:** Prevents redundant tickets using Cosine Similarity (TF-IDF).
- **Log Attachment System:** Upload and automatically parse `.log` or `.txt` files to extract error patterns.
- **RESTful Backend:** Built with Django and Django REST Framework for scalability.
- **Glassmorphism UI:** A sleek, premium dashboard built with vanilla CSS and Inter typography.

## 🛠️ Tech Stack

- **Backend:** Python, Django, DRF
- **Database:** PostgreSQL (configured for production, falling back to SQLite for local dev)
- **Machine Learning:** Scikit-Learn (TF-IDF, Logistic Regression)
- **Frontend:** Vanilla HTML/CSS/JS + Bootstrap 5 + Inter font

## 📦 Installation & Setup

### 1. Clone & Setup Environment
```bash
git clone https://github.com/Dhanyatha0105/end-to-end-ticketing-system.git
cd end-to-end-ticketing-system
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Database Migrations
```bash
python manage.py migrate
```

### 3. Training the ML Models
The system uses a synthetic dataset generator to train models for high accuracy.
```bash
cd ml_pipeline
python generate_dataset.py
python train_models.py
cd ..
```

### 4. Running the Server
```bash
python manage.py runserver
```

### 5. Accessing the Dashboard
Open `frontend/index.html` in your favorite browser.

## 🏗️ Project Structure
- `tickets/`: Core ticketing app (Models, Views, Serializers).
- `ml_models/`: ML metadata management.
- `ml_pipeline/`: Training scripts and dataset generation.
- `services/`: Service layer for ML inference and log parsing.
- `frontend/`: The modern UI implementation.

## 🧪 Testing
Run unit tests to verify system integrity:
```bash
python manage.py test
```

---
*Developed by Dhanyatha Corry as a professional system design showcase.*
