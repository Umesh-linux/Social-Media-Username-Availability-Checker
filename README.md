# ⚡ NameCheck – Social Media Username Availability Checker Using Hashing

A comprehensive, production-grade academic mini project demonstrating how **Hash Tables**, the **DJB2 Hashing Algorithm**, and **Separate Chaining** achieve average constant-time ($O(1)$) username lookups, permissioned user authentication (Normal User vs. Admin), dynamic algorithm inspection, collision visualization, and SQLite persistence across social media platforms (Instagram, Facebook, X, LinkedIn).

---

## 🌐 Direct Application & Login Link

* 🖥️ **Local Live Link (when running on your computer):** **[http://localhost:5000/](http://localhost:5000/)**
* ☁️ **Free 1-Click Cloud Deployment (Render):**  
  [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Umesh-linux/Social-Media-Username-Availability-Checker)
* 👑 **Administrator Login Credentials:**
  * **Username:** `admin`
  * **Password:** `admin`
* 👤 **Demo Normal User Login:**
  * **Username:** `alex_dev`
  * **Password:** `DemoPassword123!`

---

## 🏛️ Project Architecture & Technologies Used

| Technology / Component | Role & Implementation Details |
|---|---|
| **Frontend** | Semantic **HTML5**, responsive modern **CSS3** (CSS custom variables, Flexbox & CSS Grid), and modular vanilla **JavaScript (ES6+)**. Fully asynchronous with `fetch()` API and reactive UI updates. |
| **Backend** | **Python 3** with **Flask** microframework (`Flask 3.0.3`). RESTful API endpoints handling search, registration, login, deletion, visualization, and analytics. |
| **Data Structure** | **Custom Hash Table** using Python dictionaries as hash bucket containers with **Separate Chaining** (linked-list simulation) for collision resolution. |
| **Hashing Algorithm** | Custom implementation of **DJB2 (Dan Bernstein's algorithm)** with prime seed $5381$ and bit-shifting: `((hash << 5) + hash) + ord(char)`. |
| **Database** | **SQLite3** (`usernames.db`) with parameterized SQL queries (`?` placeholders) preventing SQL Injection attacks. |
| **Password Security** | **Bcrypt (Blowfish cipher, Cost factor 12)** with cryptographically secure random per-user salting via `bcrypt.gensalt(12)`. |
| **Email Validation** | RFC-compliant standard regular expression: `^[\w\.-]+@[\w\.-]+\.\w+$`. |

---

## 👑 Admin Dashboard Organization (9 Core Sections)

The administrator dashboard is strictly arranged in the following order:

1. **Admin Overview and Statistics:**
   - Real-time user account counts broken down by platform (Instagram, Facebook, X, LinkedIn).
   - Total registered handles stored across the system.
   - Vital signs bar: Active Hashing Engine status, Search Complexity ($O(1)$ Average), Total Queries Handled, and Password Cipher.

2. **Registered User Management:**
   - Full tabular directory showing User ID, Full Name, `@Username`, Email, Role, Verification Status, Platform, DJB2 Hash Code (hexadecimal), Bucket Index, and Registration Timestamp.
   - **Administrative Controls:** Full power to remove/delete any account from SQLite and memory, or verify emails.

3. **Username Availability Analytics:**
   - System lifetime lookup counter.
   - Availability percentage (%) vs. Conflict/Taken percentage (%).
   - Top 5 most frequently queried usernames with target platform and search volume.

4. **Live Algorithm Inspector:**
   - Live backend inspection tool calculating actual dynamic values on query:
     - Input username.
     - Hash function (DJB2: Prime 5381 $\times 33$ + ASCII).
     - Calculated 32-bit Hash Value.
     - Bucket index ($M = 10,007$).
     - Collision status (Collision vs. Unique).
     - Search complexity ($O(1)$ Average).
     - Chain traversal probe steps.
     - Lifetime search frequency count.

5. **Hash Table Execution Pipeline:**
   - Visual 6-step breakdown displaying how a string handle travels through the system:
     - **Step 1 – Input Normalization:** `username.strip().lower()`.
     - **Step 2 – DJB2 Rolling Polynomial Hash:** `((hash << 5) + hash) + ord(char)`.
     - **Step 3 – Modulo Bucket Index Mapping:** `bucket = hash % 10007`.
     - **Step 4 – Username Availability Lookup:** The system calculates the bucket index and searches the corresponding chain to determine whether the username already exists. Lookup is **O(1) average** under suitable hashing and load-factor conditions, with **O(n) worst-case complexity**.
     - **Step 5 – Separate Chaining Resolution:** Colliding keys are appended to the bucket chain as linked-list nodes.
     - **Step 6 – Dual-Layer Storage & Bcrypt Security:** Saves to SQLite with Bcrypt (cost 12) while keeping memory tables synced.

6. **Collision Resolution Visualization ($h(k) = k \bmod 7$):**
   - High-density educational table with $M = 7$ buckets demonstrating rapid collision generation.
   - Interactive trace tool walking through the chain step-by-step with matched vs. mismatched node indications.

7. **Performance Analytics & Load Factor:**
   - Mathematical calculation of load factor:
     $$\alpha = \frac{N}{M} = \frac{\text{Total Entries}}{\text{Table Capacity}}$$
   - Active tracking of: Occupied Buckets, Empty Buckets, Total Collisions, Average Chain Length, and Maximum Chain Length.
   - Platform breakdown comparison table.

8. **Database Management:**
   - One-click Seed feature adding 12 realistic accounts across all 4 platforms with Bcrypt passwords.
   - Audit trail cleaner to reset query logs without altering user records.
   - Live SQLite engine metadata (SQLite version, record counts).
   - Complete Search & Activity audit trail table.

9. **Admin Profile and Logout:**
   - Master administrator credential profile (`admin` / `admin@namecheck.edu`).
   - One-click sign-out.
   - Security inspector summary (Bcrypt, parameterized SQL, RFC email validation, zero frontend hash leakage).

---

## 👤 Public User Portal & Role Permissions

The portal supports seamless switching between **Admin Mode** and **Public User Mode**:

### Normal User Capabilities:
1. **Search & Check Availability:** Instant lookup across Instagram, Facebook, X, and LinkedIn.
2. **Alternative Username Suggestions:** If a username is taken, the backend generates intelligent, available variations (e.g. `alex_dev_official`, `real_alex_dev`, `alex_dev_99`).
3. **Registration:** Complete registration form containing:
   - Full Name
   - Unique Username
   - Email Address
   - Password & Confirm Password (real-time mismatch validator)
   - Terms & Conditions acceptance
4. **Account Removal:** Normal users can log in and **remove / delete their own registered username**, immediately releasing it back into the Hash Table for others to claim.

---

## ⏱️ Complexity Analysis & Academic Proof

| Operation | Average Case | Worst Case | Mathematical Justification |
|---|---|---|---|
| **Search (Check)** | $\mathbf{O(1)}$ | $O(n)$ | With load factor $\alpha = \frac{N}{M} \ll 0.75$, the expected chain length is $1 + \frac{\alpha}{2} \approx 1$. Thus, average probe count is 1. |
| **Insert (Register)** | $\mathbf{O(1)}$ | $O(n)$ | Computing the hash takes $O(L)$ where $L$ is string length ($\le 30$ chars, constant). Inserting into bucket list is $O(1)$. |
| **Delete (Remove)** | $\mathbf{O(1)}$ | $O(n)$ | Locating bucket index is $O(1)$, searching chain is $O(1)$ average, popping element is $O(1)$. |
| **Space Complexity** | $\mathbf{O(N + M)}$ | $O(N + M)$ | $N$ stored records + $M = 10,007$ bucket array pointers. |

---

## 🚀 Setup & Execution

### 1. Requirements
- Python 3.9+
- Flask 3.0.3
- Bcrypt

### 2. Installation
```powershell
pip install -r requirements.txt
```

### 3. Run the Application
```powershell
python app.py
```

### 4. Access the Dashboard
Open your browser and navigate to:
```
http://127.0.0.1:5000/
```

### 🔑 Demo Login Credentials
- **Admin Superuser:** Username: `admin` | Password: `Admin@1234`
- **Normal User Demo:** Username: `alex_dev` | Password: `DemoPassword123!`
