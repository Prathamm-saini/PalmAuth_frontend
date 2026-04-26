# PalmSecure: Enterprise Multi-Tier Biometric System
**Presentation Script & Technical Architecture Guide**

This document contains everything you need to know to present your project, explain the complex technical terms, and demonstrate a deep understanding of the architecture to your professor.

---

## 1. How to Run the Demo

To start your system from a completely clean slate, open your three separate editors and run the following:

**1. Python Neural Engine (PyCharm Terminal)**
```powershell
cd neural_engine
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Wait for "All models loaded — Neural Engine ready on :8000"*

**2. Java Spring Boot Backend (IntelliJ IDEA)**
Open `src/main/java/com/palmsecure/PalmSecureApplication.java` and click the green **Run (▶)** button. 
*(Ensure your local MySQL server is running in the background).*

**3. React Frontend (VS Code Terminal)**
```powershell
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## 2. Project Directory Worktree

Your microservice architecture is strictly separated into three independent codebases (tiers) to mimic enterprise-grade security environments:

```text
palm_biometric_system/
│
├── palm_frontend/          (React + Vite - Port 5173)
│   ├── src/components/     # UI Components (CameraView, LivenessGate)
│   ├── src/hooks/          # Edge AI Logic (useLiveness with MediaPipe)
│   └── src/api/palmApi.js  # API Gateway connecting to Java Backend
│
├── palm_backend/           (Java Spring Boot - Port 8081)
│   ├── controller/         # REST API Endpoints (/enroll, /verify, /liveness)
│   ├── service/            # Core Logic (BiometricService, NeuralEngineClient)
│   ├── entity/             # MySQL Database Schemas (EnrolledUserEntity)
│   └── config/             # Security & CORS configuration
│
└── palm_ml/                (Python FastAPI - Port 8000)
    ├── neural_engine/      # ML API Server (main.py)
    ├── core/               # Computer Vision logic (MotionAnalyzer)
    └── models/             # Pre-trained mathematical models (WPCA, SVM)
```

---

## 3. Technical Breakdown (How It Works)

### Tier 1: The React Frontend & Edge AI
The frontend is responsible for the user interface and **Edge Liveness Detection**.
- **MediaPipe Hands**: We use Google's MediaPipe framework directly in the browser (at the "edge") to perform real-time Liveness Detection. It tracks 21 3D landmarks of the human hand in real-time. By doing this on the frontend, we prevent "spoofing" (someone holding up a printed photo of a hand) without overloading our backend with heavy video streams.

### Tier 2: The Java Backend & BioHashing
The Java Spring Boot server acts as a secure orchestrator. The frontend is never allowed to communicate directly with the Machine Learning model; it must pass through Java first.
- **Cancelable Biometrics & BioHashing**: This is the crown jewel of your project's security. Traditional biometrics (like a fingerprint) are dangerous because if they are stolen, you cannot change your fingerprint.
- **How BioHashing Works**: Instead of saving the raw picture of the palm, the Java Backend takes the mathematical features extracted by the ML model, combines them with the user's secret PIN, and encrypts them together using a highly secure `SHA-256` hashing algorithm.
- **The Result**: The MySQL database only stores this irreversible hash. If a hacker breaches the database, they cannot reverse-engineer the user's palm. Better yet, if a user's biometric hash is ever compromised, they can simply change their PIN. This immediately generates a mathematically distinct hash for the exact same palm, essentially making the biometric "cancelable" and replaceable!

### Tier 3: The Python Neural Engine (Machine Learning)
When the Java Backend receives a palm image, it proxies it to the Python Neural Engine for feature extraction using a multi-step mathematical pipeline:
1. **CLAHE Preprocessing**: The image undergoes Contrast Limited Adaptive Histogram Equalization. This normalizes the lighting across the image, preventing shadows from destroying the accuracy, and enhances the sharp ridges of the palm.
2. **Feature Extraction**: The image is flattened into a highly dense 1280-dimension mathematical vector representing the unique visual traits of the palm.
3. **Fisher Discriminant Filter**: This statistical filter analyzes the 1280 traits and filters out the "noisy" or useless data, keeping only the indices that mathematically separate different identities the best.
4. **WPCA (Whitened Principal Component Analysis)**: This algorithm takes the filtered traits and compresses them (Dimensionality Reduction) to avoid the "Curse of Dimensionality". The "Whitening" step ensures that all extracted features have equal variance, meaning no single feature overpowers the others.
5. **SVM (Support Vector Machine)**: Finally, these optimized mathematical features are passed through an SVM classifier to calculate probability scores and confidence levels.

---
