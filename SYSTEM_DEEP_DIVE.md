# PalmSecure — Complete System Deep Dive
> Share this entire file with any AI to continue iterating on the project.

---

## 1. HOW TO RUN EVERYTHING

### Start order matters:
```
Step 1 → Start MySQL (must be running for Java to connect)
Step 2 → Python ML Engine
Step 3 → Java Spring Boot Backend
Step 4 → React Frontend
```

### Python Neural Engine (PyCharm terminal):
```powershell
cd C:\Users\Pratham\OneDrive\Desktop\palm_ml\neural_engine
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Wait for: `✅ All models loaded — Neural Engine ready on :8000`

### Java Backend (IntelliJ IDEA):
- Open project: `C:\Users\Pratham\OneDrive\Desktop\palm_backend`
- Click the green ▶ Run button on `PalmSecureApplication.java`
- Runs on: `http://localhost:8081`
- Connects to MySQL: `jdbc:mysql://localhost:3306/palmauth` (user: root, pass: 1234)

### React Frontend (VS Code terminal):
```powershell
cd C:\Users\Pratham\OneDrive\Desktop\palm_frontend
npm run dev
```
Open browser: `http://localhost:5173`

---

## 2. SYSTEM ARCHITECTURE — 3 MICROSERVICES

```
┌─────────────────────────────────────────────────────────┐
│                  USER'S BROWSER                         │
│   React + Vite Frontend   →   localhost:5173            │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ HomePage    │  │ EnrollPage   │  │ VerifyPage    │  │
│  │ AdminPage   │  │ SessionPage  │  │ DocsPage      │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  Edge AI (runs IN browser, no server needed):           │
│  → MediaPipe Hands (Google CDN) — detects 21 hand pts   │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP (port 8081)
                    ▼
┌─────────────────────────────────────────────────────────┐
│         Java Spring Boot Backend — localhost:8081       │
│                                                         │
│  /api/v1/enroll    → validates, hashes, saves to MySQL  │
│  /api/v1/verify    → compares features, returns score   │
│  /api/v1/liveness  → proxies to Python                  │
│  /api/v1/check-id  → checks if username taken           │
│  /api/v1/admin/users → list/delete database records     │
│                                                         │
│  MySQL: palmauth.enrolled_users                         │
│  Columns: user_id | bio_hash | features_json            │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP (port 8000)
                    ▼
┌─────────────────────────────────────────────────────────┐
│       Python FastAPI Neural Engine — localhost:8000     │
│                                                         │
│  /extract   → image → 1280 raw features → WPCA → 410d  │
│  /liveness  → landmark frames → motion/gesture scores  │
│  /health    → ping                                      │
│                                                         │
│  Models loaded at startup:                              │
│  - palmnet_pipeline.onnx   (ONNX backbone)             │
│  - fisher_top_indices.npy  (feature filter)            │
│  - palm_wpca_transformer.pkl (dimensionality reduction)│
│  - palm_svm_classifier.pkl  (identity classifier)      │
│  - label_encoder.pkl        (ID decoder)               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. ML MODEL PIPELINE — IN DEPTH

### What happens when you capture a palm image:

#### Step A — Image Preprocessing (Python: main.py)
```
Raw webcam JPEG (base64 encoded)
       ↓
cv2.imdecode() → BGR numpy array
       ↓
Resize to 32×40 pixels
       ↓
Flatten → 1280 float32 values (each = one pixel brightness 0.0-1.0)
```
**Why 32×40?** The ONNX model expects 600 input features in a flat vector. We extract 1280 raw pixel features and then the Fisher filter reduces this down to the right count. The resolution is deliberately low — we don't need pixel-perfect detail, we need the SHAPE and PATTERN of the palm ridges.

#### Step B — Fisher Discriminant Filter (Python: main.py)
```
1280 raw pixel features
       ↓
fisher_top_indices.npy  (a list of 600 index positions)
       ↓
raw_features[fisher_idx] → keeps only the 600 MOST DISCRIMINATIVE indices
       ↓
600 features (the noise is removed)
```
**What is Fisher Discriminant?** During training, a statistical analysis was done on a dataset of many palms. For each of the 1280 pixel positions, it calculated: "how much does this pixel position help SEPARATE different people's palms?" Positions that look the same on everyone (like the middle of the palm) scored LOW. Positions that differ strongly between people (like the pattern of ridges near the fingers) scored HIGH. The top 600 positions are saved in `fisher_top_indices.npy`.

#### Step C — WPCA (Whitened Principal Component Analysis) (Python: main.py)
```
600 Fisher-selected features
       ↓
palm_wpca_transformer.pkl.transform()
       ↓
410 WPCA compressed features
```
**What is PCA?** Principal Component Analysis finds the "directions of most variance" in the data. Instead of 600 individual pixels, it finds 410 mathematical combinations of those pixels that together capture the most important information. This is called Dimensionality Reduction — going from 600 numbers to 410 numbers while losing minimal information.

**What is the "Whitening" part (WPCA)?** After PCA, some components might have very large values and some very small. Whitening normalizes all 410 components to have equal variance (standard deviation = 1). This is critical because if one feature is 1000x larger than another, the SVM will incorrectly treat the big one as far more important. Whitening ensures equal weight.

#### Step D — SVM Classifier (Python: main.py)
```
410 WPCA features
       ↓
palm_svm_classifier.pkl.predict_proba()
       ↓
Array of probabilities, one per known identity
       ↓
[0.02, 0.91, 0.03, 0.04, ...]  ← "91% likely this is person #2"
       ↓
label_encoder.pkl → decodes index 1 to actual username string
```
**What is an SVM?** Support Vector Machine is a classical machine learning classifier. It finds the mathematical "boundary lines" (hyperplanes) in 410-dimensional space that best separate different people's palm feature vectors. Think of it as drawing lines between clusters of dots in a very high-dimensional scatter plot.

**What is predict_proba?** Returns a confidence score (0.0 to 1.0) for each known identity. The highest score wins. If the score is above 0.72, access is GRANTED.

#### Step E — Liveness Detection (Python: core/motion_analyzer.py)
This is completely SEPARATE from the feature extraction pipeline. The liveness check does NOT use the ONNX model at all.

```
Video frames (21 hand landmarks per frame, collected over 4 seconds)
       ↓
MotionAnalyzer.check(frames, require_gesture=True)
       ↓
motion_score  = how much did the hand MOVE between frames?
               (calculated as average Euclidean distance of landmarks)
gesture_score = did the hand make a specific movement pattern?
               (wrist landmark trajectory analysis)
       ↓
is_live = (motion_score > threshold) AND (gesture_score > threshold)
```
**Why liveness?** To prevent someone from printing your photo and holding it up. A real hand moves naturally. A photo is perfectly still. The motion_score will be near 0 for a photo, but non-zero for a real hand.

---

## 4. BIOHASHING — THE PRIVACY SYSTEM (Java: BiometricService.java)

### The problem with normal biometrics:
If a database stores your raw fingerprint image and gets hacked → your fingerprint is stolen FOREVER. You cannot change your fingerprint.

### How BioHashing solves this:
```
[Palm Features from ML] + [User's Secret PIN]
              ↓
"userId:token:spectralFingerprint" → SHA-256 hash → 64 character hex string

Example:
"pratham_24:mysecretpin:850nm:8030" → SHA-256 → "60b2e31b37d3c4b3fa55948..."
```

**What is SHA-256?** A one-way mathematical function. You can put any string in and get a fixed 64-character hex string out. You can NEVER reverse it. Even if someone steals the hex string from the database, they cannot recover your PIN or palm image.

**What makes it "Cancelable"?**
- User: pratham_24, PIN: "abc" → BioHash: "60b2e31..."
- User: pratham_24, PIN: "xyz" → BioHash: "9f4a1c7..."

The SAME palm + a DIFFERENT pin = a COMPLETELY DIFFERENT hash. So if the database is ever hacked, you just change your PIN and you get a brand new digital identity. Your palm didn't change but your BioHash did.

**What is stored in MySQL:**
```sql
user_id       = "pratham_24"           (the username)
bio_hash      = "60b2e31b37d3c4b3..."  (SHA-256, can never be reversed)
features_json = {"850nm": [-0.32, 0.56, ...]}  (the 410 WPCA feature values)
```
NOTE: features_json stores the compressed mathematical vectors, not any image. The actual JPEG is discarded immediately after feature extraction.

---

## 5. ENROLLMENT FLOW — END TO END

```
[USER] Opens /enroll page in browser
    ↓
[REACT] Shows Step 0: "Capture Details"
    ↓
[USER] Types User ID and secure PIN
    ↓
[USER] Clicks "START CAMERA"
    ↓
[REACT useCamera.js] Calls navigator.mediaDevices.getUserMedia()
    ↓
[USER] Clicks "CAPTURE PALM"
    ↓
[REACT EnrollPage.jsx] Loads MediaPipe Hands (Google CDN)
    → Validates the captured image has a real palm in it
    → If no palm detected: red error, stops here
    → If palm detected: saves base64 JPEG in state as captured['850nm']
    ↓
[USER] Fills in User ID + PIN + palm captured → "PROCEED TO LIVENESS" glows neon green
    ↓
[USER] Clicks "PROCEED TO LIVENESS"
    ↓
[REACT] Calls Java backend GET /api/v1/check-id?userId=pratham_24
    → Java checks MySQL: does this user_id already exist?
    → If YES: red border on input, "Oops, this username is already taken!"
    → If NO: proceed to Step 1
    ↓
[REACT] Shows Step 1: "Liveness Check"
    ↓
[USER] Clicks "START LIVENESS"
    ↓
[REACT useLiveness.js] Runs MediaPipe Hands on live video for 4 seconds
    → Collects frames with 21 landmark coordinates per frame
    → Minimum 5 frames needed
    ↓
[REACT] POST to Java /api/v1/liveness with frame data
    ↓
[JAVA BiometricService.java] Proxies frames to Python /liveness
    ↓
[PYTHON MotionAnalyzer] Analyzes motion and gesture scores
    → Returns: { is_live: true/false, motion_score, gesture_score, reason }
    ↓
[JAVA] Returns liveness result to React
    ↓
[REACT] If is_live = true → AUTO TRIGGERS handleEnroll()
    ↓
[REACT] POST to Java /api/v1/enroll with {userId, captured, token}
    ↓
[JAVA BiometricService.enroll()]
    1. Validates inputs
    2. Checks userId not already taken (double-check)
    3. Calls Python /extract with base64 image
    4. Python returns 410 WPCA features
    5. Combines userId + token + features → SHA-256 BioHash
    6. Saves to MySQL: (user_id, bio_hash, features_json)
    7. Returns: {userId, latencyMs, message}
    ↓
[REACT] Shows Step 2: "Enrollment Complete ✨"
```

---

## 6. VERIFICATION FLOW — END TO END

```
[USER] Opens /verify page
    ↓
[REACT] Camera starts, user shows palm
    ↓
[USER] Captures palm image
    ↓
[REACT] POST to Java /api/v1/verify with {captured, fusionRule: "WHT"}
    ↓
[JAVA BiometricService.verify()]
    1. Loads ALL enrolled users from MySQL
    2. For each enrolled user:
       a. POST to Python /extract with the NEW candidate image
       b. Gets 410 features from Python
       c. Computes cosine similarity between candidate features and enrolled features
       d. Fuses scores using WHT (Weighted Harmonic Technique)
    3. Picks the user with the HIGHEST fused score
    4. If score >= 0.72 → GRANTED
    5. Returns: {granted, matchedIdentity, fusedScore, secretKey, latencyMs}
    ↓
[REACT] Shows result: ACCESS GRANTED or DENIED with score breakdown
```

**What is Cosine Similarity?**
```
score = (A · B) / (|A| × |B|)

Where A = enrolled feature vector (410 numbers)
      B = candidate feature vector (410 numbers)
      · = dot product (multiply each pair, sum them all)
      |A| = magnitude (square root of sum of squares)

Result: 0.0 = completely different people
        1.0 = mathematically identical (same person)
        0.72+ = close enough → access granted
```

---

## 7. KEY FILES MAP

```
palm_frontend/
├── src/pages/
│   ├── HomePage.jsx      ← Landing page with hero, stats, how-it-works
│   ├── EnrollPage.jsx    ← 2-step enrollment (capture + liveness)
│   ├── VerifyPage.jsx    ← Palm verification
│   ├── AdminPage.jsx     ← Live database viewer with revoke button
│   └── SessionPage.jsx   ← Continuous monitoring session
├── src/hooks/
│   ├── useCamera.js      ← Webcam stream management
│   └── useLiveness.js    ← MediaPipe liveness collection + API call
├── src/api/
│   └── palmApi.js        ← All fetch() calls to Java backend (port 8081)
└── src/components/
    ├── Sidebar.jsx        ← Left navigation
    ├── CameraView.jsx     ← Video element + ROI overlay canvas
    └── LivenessGate.jsx   ← Liveness start/status/result UI

palm_backend/
├── controller/PalmController.java     ← REST endpoints
├── service/BiometricService.java      ← Core business logic + BioHashing
├── service/NeuralEngineClient.java    ← HTTP client to Python (RestTemplate)
├── entity/EnrolledUserEntity.java     ← MySQL table schema
├── repository/UserRepository.java     ← JPA database queries
└── resources/application.properties  ← port=8081, MySQL config

palm_ml/
├── neural_engine/main.py    ← FastAPI app, /extract and /liveness endpoints
├── core/motion_analyzer.py  ← Liveness motion/gesture scoring logic
└── models/
    ├── palmnet_pipeline.onnx          ← ONNX backbone (input: [None,600])
    ├── fisher_top_indices.npy         ← 600 best feature indices
    ├── palm_wpca_transformer.pkl      ← WPCA model (600→410 dimensions)
    ├── palm_svm_classifier.pkl        ← SVM classifier
    └── label_encoder.pkl              ← Index → username decoder
```

---

## 8. PRESENTATION SCRIPT (Word for word)

**Opening:**
"Good morning. My project is PalmSecure — an enterprise biometric authentication system that uses your palm print to identify you. It's built as a 3-tier microservice architecture, inspired by how large-scale identity systems are deployed in industry."

**Architecture:**
"The system has three completely separate services. First, a React frontend where users interact. Second, a Java Spring Boot gateway that handles all security logic. Third, a Python FastAPI service that runs the machine learning pipeline. The frontend never touches the ML engine directly. Everything goes through Java. This is a deliberate security design — it's called a Gateway Pattern."

**Liveness Detection:**
"When a user enrolls or verifies, the first thing that happens is Liveness Detection. We use Google MediaPipe directly inside the browser — this is called Edge AI. It tracks 21 three-dimensional landmarks on the user's hand in real time, 10 frames per second. This confirms that a real, physically present hand is in frame. Without this, someone could print my photo and hold it up to fool the system."

**ML Pipeline:**
"Once we have the image, it goes to our Python Neural Engine. The image is flattened into a 1280-dimensional feature vector — essentially 1280 numbers representing the pixel brightness pattern. Then a Fisher Discriminant Filter selects the 600 most statistically useful positions — the ones that best separate different people's palms. Then Whitened PCA compresses this to 410 dimensions, ensuring all features have equal importance. Finally, a Support Vector Machine classifies the palm against all enrolled identities and returns a confidence score."

**BioHashing:**
"Now here is what makes this academically significant — Cancelable Biometrics via BioHashing. Traditional biometric systems store your raw fingerprint or face image. If their database is hacked, your biometric is stolen permanently. You cannot get a new fingerprint. We solve this by never storing any image at all. The Java backend takes the 410 mathematical features, combines them with the user's secret PIN, and runs the whole thing through SHA-256 encryption. The database only stores a 64-character hash. It cannot be reversed. And if someone's hash is ever stolen, they just change their PIN — generating a completely new hash from the same palm. That's what makes it cancelable."

**Demo:**
"Let me show you. I'll enroll a new identity now. I type my User ID and PIN, hold my palm to the camera — you can see MediaPipe detecting 21 landmarks in real time. Now I capture. The system validates my palm is real, not a photo. I pass the liveness check. And now if I open the Admin Panel, you can see my record appear in the MySQL database — with my BioHash and feature vectors, but no image anywhere."

**Closing:**
"To summarize: real-time palm detection at the edge, privacy-preserving cancelable BioHashes, and a full 3-tier microservice architecture. Thank you."

---

## 9. TECHNICAL TERMS GLOSSARY

| Term | Plain English Meaning |
|---|---|
| Microservice | Each part of the app runs as a completely separate program |
| Edge AI | AI running directly in the browser/device, not on a server |
| MediaPipe | Google's library for real-time hand/face/body landmark detection |
| Landmark | A specific detected point on the hand (e.g. fingertip = landmark 8) |
| Feature Vector | A list of numbers mathematically describing something (a palm, a face, etc.) |
| Dimensionality Reduction | Shrinking a long list of numbers into a shorter one while keeping the important info |
| Fisher Discriminant | A statistical method to find which features best separate groups |
| PCA | Finds the most important "directions" in a high-dimensional dataset |
| Whitening | Normalizing all features to have equal scale/variance |
| SVM | A classifier that draws mathematical boundaries between groups |
| Cosine Similarity | A score (0-1) measuring how "pointing in the same direction" two vectors are |
| SHA-256 | A cryptographic one-way hash function. Input → 64-char hex. Cannot be reversed. |
| BioHash | A hash created from biometric features + a PIN. Cancelable and privacy-safe. |
| Cancelable Biometrics | Biometric templates that can be "revoked" and regenerated by changing a PIN |
| ONNX | Open Neural Network Exchange — a universal ML model format |
| JPA | Java Persistence API — Java's way of talking to SQL databases |
| CORS | Cross-Origin Resource Sharing — browser security rule that Java must explicitly allow |
| RestTemplate | Java's built-in HTTP client for calling other APIs (used to call Python) |
| Gateway Pattern | Routing all client requests through one secure server before reaching backend services |

---

## 10. WHAT TO TELL ANOTHER AI TO CONTINUE THIS PROJECT

Copy and paste this prompt:

"I have a palm biometric authentication system with 3 services:
1. React/Vite frontend (port 5173) at `palm_frontend/`
2. Java Spring Boot backend (port 8081) at `palm_backend/`
3. Python FastAPI ML engine (port 8000) at `palm_ml/neural_engine/`

The MySQL database is `palmauth`, table `enrolled_users` with columns: user_id (PK), bio_hash, features_json.

The ML pipeline: image → 1280 pixel features → Fisher filter (600 indices from fisher_top_indices.npy) → WPCA transform (palm_wpca_transformer.pkl, 410 output dims) → SVM classifier (palm_svm_classifier.pkl). Features stored as JSON. BioHash = SHA-256(userId + ':' + token + ':' + spectralFingerprint).

Liveness uses MediaPipe Hands in the browser collecting 21 landmarks per frame for 4 seconds, sent to Python MotionAnalyzer.

Current known issues / things to improve: [describe what you want to change here]"
