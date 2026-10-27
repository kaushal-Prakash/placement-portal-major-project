import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, precision_score, recall_score
import joblib

np.random.seed(42)

def generate_nie_synthetic_data(num_samples=1200):
    branches = ['CSE', 'ISE', 'ECE']
    branch_weights = [0.42, 0.33, 0.25]
    
    batches = [2021, 2022, 2023, 2024, 2025]
    batch_weights = [0.18, 0.20, 0.22, 0.20, 0.20]
    
    data = []
    
    for i in range(num_samples):
        branch = np.random.choice(branches, p=branch_weights)
        batch = int(np.random.choice(batches, p=batch_weights))
        
        # CGPA with realistic Tier-3 distribution: mean 7.6, stdev 0.85
        cgpa = float(np.clip(np.random.normal(7.65, 0.85), 5.4, 9.95).round(2))
        
        tenth_pct = float(np.clip(np.random.normal(85.0, 7.0), 55.0, 99.0).round(1))
        twelfth_pct = float(np.clip(np.random.normal(82.5, 7.5), 52.0, 98.5).round(1))
        
        # Active backlogs: 80% have 0, 12% have 1, 5% have 2, 3% have 3+
        r_backlog = np.random.rand()
        if r_backlog < 0.80:
            active_backlogs = 0
        elif r_backlog < 0.92:
            active_backlogs = 1
        elif r_backlog < 0.97:
            active_backlogs = 2
        else:
            active_backlogs = int(np.random.choice([3, 4]))
            
        history_backlogs = active_backlogs + (1 if np.random.rand() < 0.15 else 0)
        
        # Technical DSA & Core assessment score (0-100) correlated with CGPA
        dsa_base = (cgpa - 5.0) * 16.0 + np.random.normal(0, 12)
        dsa_score = float(np.clip(dsa_base, 15.0, 98.0).round(1))
        
        # Resume Skill Match score against typical campus JDs
        skill_match = float(np.clip(dsa_score * 0.7 + np.random.normal(15, 10), 20.0, 96.0).round(1))
        
        # Soft skills & communication (0-100)
        soft_skills = float(np.clip(np.random.normal(72.0, 12.0), 30.0, 98.0).round(1))
        
        # Internships: 0, 1, or 2
        internships = int(np.random.choice([0, 1, 2], p=[0.45, 0.40, 0.15]))
        
        # Projects count: 1 to 4
        projects = int(np.random.choice([1, 2, 3, 4], p=[0.25, 0.45, 0.20, 0.10]))
        
        # Latent Placement Index (Logistic logit calculation)
        branch_boost = 0.4 if branch in ['CSE', 'ISE'] else -0.1
        logit = (
            -5.5
            + 0.85 * (cgpa - 6.0)
            + 0.045 * (dsa_score - 50)
            + 0.035 * (skill_match - 50)
            + 0.025 * (soft_skills - 50)
            + 0.60 * internships
            + 0.30 * (projects - 1)
            - 1.60 * active_backlogs
            - 0.40 * (history_backlogs - active_backlogs)
            + branch_boost
        )
        
        prob = 1.0 / (1.0 + np.exp(-logit))
        is_placed = int(np.random.rand() < prob)
        
        # Package in LPA
        if is_placed:
            ctc_base = 4.5 + (cgpa - 6.5) * 1.8 + (dsa_score - 50) * 0.15 + internships * 1.5
            if dsa_score > 85 and cgpa > 8.5:
                ctc_base += np.random.choice([10.0, 14.0, 18.0])  # Dream offer (Google / BMW / Fidelity)
            ctc = float(np.clip(ctc_base + np.random.normal(0, 1.2), 4.2, 32.0).round(2))
            
            if ctc >= 12.0:
                tier = "Super Dream (>12 LPA)"
                company = np.random.choice(["Google", "Fidelity Investments", "BMW", "Cisco", "Akamai"])
            elif ctc >= 7.0:
                tier = "Dream (7-12 LPA)"
                company = np.random.choice(["FitTech", "Schneider Electric", "CommScope", "Samsung"])
            else:
                tier = "Core / Mass (4-7 LPA)"
                company = np.random.choice(["TCS Digital", "Infosys DSE", "Wipro Turbo", "Cognizant GenC"])
        else:
            ctc = 0.0
            tier = "Unplaced"
            company = "None"
            
        data.append({
            "student_id": f"NIE{batch}_{branch}_{i+1:04d}",
            "batch": batch,
            "branch": branch,
            "cgpa": cgpa,
            "tenth_pct": tenth_pct,
            "twelfth_pct": twelfth_pct,
            "active_backlogs": active_backlogs,
            "history_backlogs": history_backlogs,
            "dsa_score": dsa_score,
            "skill_match": skill_match,
            "soft_skills": soft_skills,
            "internships": internships,
            "projects": projects,
            "is_placed": is_placed,
            "ctc_lpa": ctc,
            "offer_tier": tier,
            "company_name": company
        })
        
    df = pd.DataFrame(data)
    return df

def train_and_export_model():
    print("[ML Pipeline] Generating synthetic dataset for NIE Mysore placement cohort...")
    df = generate_nie_synthetic_data(1500)
    
    # Save CSV dataset
    dataset_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
    os.makedirs(dataset_dir, exist_ok=True)
    csv_path = os.path.join(dataset_dir, "nie_placement_synthetic_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"[ML Pipeline] Saved synthetic dataset to: {csv_path} ({len(df)} rows)")
    
    feature_cols = [
        'cgpa', 'tenth_pct', 'twelfth_pct', 'active_backlogs',
        'history_backlogs', 'dsa_score', 'skill_match', 'soft_skills',
        'internships', 'projects'
    ]
    
    X = df[feature_cols]
    y = df['is_placed']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"[ML Pipeline] Training Random Forest & Gradient Boosting models on {len(X_train)} samples...")
    model = GradientBoostingClassifier(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    acc = float(accuracy_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_prob))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    
    print(f"[ML Pipeline] Evaluation Metrics:")
    print(f"  - Accuracy:  {acc*100:.2f}%")
    print(f"  - ROC-AUC:   {auc:.4f}")
    print(f"  - Precision: {prec*100:.2f}%")
    print(f"  - Recall:    {rec*100:.2f}%")
    
    # Feature importances
    importances = {feat: round(float(imp) * 100, 2) for feat, imp in zip(feature_cols, model.feature_importances_)}
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    print("\n[ML Pipeline] Top Feature Importances (%):")
    for feat, imp in sorted_importances:
        print(f"  - {feat:16s}: {imp}%")
        
    # Save Model Artifacts
    model_path = os.path.join(os.path.dirname(__file__), "placement_ml_model.joblib")
    joblib.dump(model, model_path)
    print(f"[ML Pipeline] Saved trained model to: {model_path}")
    
    # Save Model Metadata JSON for easy fast inference & frontend display
    meta_path = os.path.join(os.path.dirname(__file__), "placement_ml_meta.json")
    meta = {
        "model_type": "GradientBoostingClassifier (Ensemble Trees)",
        "college": "The National Institute of Engineering (NIE), Mysore",
        "training_samples": len(df),
        "features": feature_cols,
        "metrics": {
            "accuracy": round(acc * 100, 1),
            "roc_auc": round(auc, 3),
            "precision": round(prec * 100, 1),
            "recall": round(rec * 100, 1)
        },
        "feature_importances": dict(sorted_importances)
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"[ML Pipeline] Saved model metadata to: {meta_path}")

if __name__ == "__main__":
    train_and_export_model()
