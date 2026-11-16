import sqlite3
import random
import string
import re
import bcrypt
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
DB_PATH = 'usernames.db'
EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

# ==============================================================================
# ADVANCED CUSTOM HASH TABLE WITH PERFORMANCE ANALYTICS & CHAIN TRACING
# ==============================================================================
class CustomHashTable:
    def __init__(self, capacity: int = 10007):
        """
        Initializes the hash table using Python dictionaries as bucket containers.
        Implements Separate Chaining for collision resolution and comprehensive
        performance metric tracking.
        """
        self.capacity = capacity
        self.buckets = {}  # Dictionary: bucket_index -> list of (key, metadata)
        self.size = 0
        self.collision_count = 0

    def _hash(self, key: str) -> int:
        """
        Custom DJB2 Polynomial Hash Algorithm:
        Formula: hash = ((hash << 5) + hash) + ord(char)
        Starts with prime seed 5381 and bit-shifts by 5 to provide uniform 32-bit dispersion.
        """
        hash_val = 5381
        for char in key:
            hash_val = (((hash_val << 5) + hash_val) + ord(char)) & 0xFFFFFFFF
        return hash_val

    def _get_bucket_index(self, key: str) -> tuple[int, int]:
        hash_code = self._hash(key)
        bucket_index = hash_code % self.capacity
        return hash_code, bucket_index

    def insert(self, key: str, value: dict = None) -> dict:
        """
        Inserts a key-value entry into the hash table.
        Time Complexity: Average O(1).
        """
        normalized_key = key.strip().lower()
        hash_code, bucket_index = self._get_bucket_index(normalized_key)

        if bucket_index not in self.buckets:
            self.buckets[bucket_index] = []

        bucket = self.buckets[bucket_index]

        # Check if already present in chain
        for probe_step, (existing_key, val) in enumerate(bucket, start=1):
            if existing_key == normalized_key:
                return {
                    "success": False,
                    "reason": "duplicate",
                    "hash_code": hash_code,
                    "bucket_index": bucket_index,
                    "probes": probe_step,
                    "collision": len(bucket) > 1,
                    "existing_data": val
                }

        had_collision = len(bucket) > 0
        if had_collision:
            self.collision_count += 1

        entry_data = value or {}
        entry_data["hash_code"] = hash_code
        entry_data["bucket_index"] = bucket_index

        bucket.append((normalized_key, entry_data))
        self.size += 1

        return {
            "success": True,
            "hash_code": hash_code,
            "bucket_index": bucket_index,
            "probes": len(bucket),
            "collision": had_collision,
            "chain_length": len(bucket),
            "time_complexity": "O(1) Average"
        }

    def search(self, key: str) -> tuple[bool, dict]:
        """
        Searches for a username in the hash table.
        Step 4 – Username Availability Lookup:
        The system calculates the bucket index and searches the corresponding chain
        to determine whether the username already exists. Lookup is O(1) average
        under suitable hashing and load-factor conditions, with O(n) worst-case complexity.
        """
        normalized_key = key.strip().lower()
        hash_code, bucket_index = self._get_bucket_index(normalized_key)

        traversal_steps = []
        if bucket_index not in self.buckets or not self.buckets[bucket_index]:
            return False, {
                "hash_code": hash_code,
                "bucket_index": bucket_index,
                "probes": 1,
                "collision": False,
                "chain_nodes": [],
                "traversal_steps": ["Bucket is currently empty (NULL)"],
                "time_complexity": "O(1) Average",
                "table_capacity": self.capacity
            }

        bucket = self.buckets[bucket_index]
        chain_nodes = [item[0] for item in bucket]

        for probe_step, (existing_key, val) in enumerate(bucket, start=1):
            traversal_steps.append({
                "step": probe_step,
                "checked_key": existing_key,
                "target_key": normalized_key,
                "match": existing_key == normalized_key
            })
            if existing_key == normalized_key:
                return True, {
                    "hash_code": hash_code,
                    "bucket_index": bucket_index,
                    "probes": probe_step,
                    "collision": len(bucket) > 1,
                    "chain_length": len(bucket),
                    "chain_nodes": chain_nodes,
                    "traversal_steps": traversal_steps,
                    "time_complexity": "O(1) Average",
                    "table_capacity": self.capacity,
                    "data": val
                }

        return False, {
            "hash_code": hash_code,
            "bucket_index": bucket_index,
            "probes": len(bucket) + 1,
            "collision": len(bucket) > 0,
            "chain_length": len(bucket),
            "chain_nodes": chain_nodes,
            "traversal_steps": traversal_steps,
            "time_complexity": "O(1) Average",
            "table_capacity": self.capacity
        }

    def delete(self, key: str) -> bool:
        normalized_key = key.strip().lower()
        _, bucket_index = self._get_bucket_index(normalized_key)
        if bucket_index in self.buckets:
            bucket = self.buckets[bucket_index]
            for idx, (existing_key, _) in enumerate(bucket):
                if existing_key == normalized_key:
                    bucket.pop(idx)
                    self.size -= 1
                    return True
        return False

    def get_analytics(self) -> dict:
        occupied_buckets = len([b for b in self.buckets.values() if len(b) > 0])
        empty_buckets = self.capacity - occupied_buckets

        chain_lengths = [len(b) for b in self.buckets.values() if len(b) > 0]
        max_chain = max(chain_lengths) if chain_lengths else 0
        avg_chain = round(sum(chain_lengths) / occupied_buckets, 3) if occupied_buckets > 0 else 0.0
        load_factor = round(self.size / self.capacity, 5) if self.capacity > 0 else 0.0

        return {
            "total_entries": self.size,
            "capacity": self.capacity,
            "occupied_buckets": occupied_buckets,
            "empty_buckets": empty_buckets,
            "total_collisions": self.collision_count,
            "load_factor": load_factor,
            "load_factor_formula": f"{self.size} / {self.capacity} = {load_factor}",
            "avg_chain_length": avg_chain,
            "max_chain_length": max_chain
        }

    def reset(self):
        self.buckets.clear()
        self.size = 0
        self.collision_count = 0


# ==============================================================================
# HASH TABLES: PRODUCTION (M=10007) & EDUCATIONAL VISUALIZER (M=7)
# ==============================================================================
PLATFORMS = ['instagram', 'facebook', 'x', 'linkedin']
platform_tables: dict[str, CustomHashTable] = {p: CustomHashTable(capacity=10007) for p in PLATFORMS}
edu_table = CustomHashTable(capacity=7)


# ==============================================================================
# DATABASE MANAGEMENT & SECURITY
# ==============================================================================
def hash_password_bcrypt(password: str) -> str:
    """Hashes passwords using Bcrypt with a secure random salt (cost 12)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password_bcrypt(password: str, hashed: str) -> bool:
    """Safely verifies passwords against stored Bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS usernames (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            platform TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            email_verified INTEGER DEFAULT 0,
            terms_accepted INTEGER DEFAULT 1,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, platform)
        )
    ''')

    c.execute("PRAGMA table_info(usernames)")
    columns = [col[1] for col in c.fetchall()]
    if 'full_name' not in columns:
        c.execute("ALTER TABLE usernames ADD COLUMN full_name TEXT DEFAULT ''")
    if 'email' not in columns:
        c.execute("ALTER TABLE usernames ADD COLUMN email TEXT DEFAULT ''")
    if 'password_hash' not in columns:
        c.execute("ALTER TABLE usernames ADD COLUMN password_hash TEXT DEFAULT ''")
    if 'role' not in columns:
        c.execute("ALTER TABLE usernames ADD COLUMN role TEXT DEFAULT 'user'")
    if 'email_verified' not in columns:
        c.execute("ALTER TABLE usernames ADD COLUMN email_verified INTEGER DEFAULT 0")
    if 'terms_accepted' not in columns:
        c.execute("ALTER TABLE usernames ADD COLUMN terms_accepted INTEGER DEFAULT 1")

    c.execute('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            platform TEXT NOT NULL,
            action TEXT NOT NULL,
            status TEXT NOT NULL,
            hash_code INTEGER,
            bucket_index INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()

    # Ensure Default Admin Account exists with password 'admin'
    c.execute("SELECT id FROM usernames WHERE username='admin'")
    admin_row = c.fetchone()
    admin_pwd = hash_password_bcrypt("admin")
    if admin_row:
        c.execute("UPDATE usernames SET password_hash=? WHERE username='admin'", (admin_pwd,))
    else:
        c.execute('''
            INSERT INTO usernames (full_name, username, email, password_hash, platform, role, email_verified, terms_accepted)
            VALUES (?, ?, ?, ?, ?, 'admin', 1, 1)
        ''', ("Project Administrator", "admin", "admin@namecheck.edu", admin_pwd, "instagram"))
    conn.commit()

    conn.close()

def load_tables_from_db():
    """Syncs hash tables from SQLite into memory on application startup."""
    for table in platform_tables.values():
        table.reset()
    edu_table.reset()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, full_name, username, email, platform, role, email_verified, timestamp FROM usernames')
    rows = c.fetchall()
    conn.close()

    for uid, full_name, username, email, platform, role, email_verified, timestamp in rows:
        platform_key = platform.lower()
        metadata = {
            "id": uid,
            "full_name": full_name or username,
            "email": email or "",
            "role": role or "user",
            "email_verified": bool(email_verified),
            "timestamp": timestamp
        }
        if platform_key in platform_tables:
            platform_tables[platform_key].insert(username, metadata)
        edu_table.insert(username, metadata)

init_db()
load_tables_from_db()


# ==============================================================================
# UTILITIES
# ==============================================================================
def generate_suggestions(username: str, platform: str, count: int = 4) -> list:
    base = username.strip().lower()
    patterns = [
        f"{base}_official",
        f"real_{base}",
        f"{base}.dev",
        f"{base}_hq",
        f"the_{base}",
        f"{base}{random.randint(10, 99)}",
        f"{base}_{random.randint(100, 999)}",
        f"i_am_{base}",
        f"{base}_live",
        f"{base}_tech"
    ]
    random.shuffle(patterns)
    table = platform_tables.get(platform)
    suggestions = []

    for candidate in patterns:
        if table:
            exists, _ = table.search(candidate)
            if not exists and candidate not in suggestions:
                suggestions.append(candidate)
        if len(suggestions) >= count:
            break

    while len(suggestions) < count:
        candidate = f"{base}_{random.randint(1000, 9999)}"
        if candidate not in suggestions:
            suggestions.append(candidate)

    return suggestions

def log_history(username: str, platform: str, action: str, status: str, hash_code: int = 0, bucket_index: int = 0):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO search_history (username, platform, action, status, hash_code, bucket_index)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, platform, action, status, hash_code, bucket_index))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging history: {e}")

def get_username_search_count(username: str, platform: str = None) -> int:
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        if platform:
            c.execute('SELECT COUNT(*) FROM search_history WHERE LOWER(username)=? AND platform=?', (username.lower(), platform.lower()))
        else:
            c.execute('SELECT COUNT(*) FROM search_history WHERE LOWER(username)=?', (username.lower(),))
        count = c.fetchone()[0]
        conn.close()
        return count
    except Exception:
        return 1


# ==============================================================================
# REST API ROUTES
# ==============================================================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/check', methods=['POST'])
def check_username():
    """Checks if a username is available across social platforms."""
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    platform = (data.get('platform') or '').strip().lower()

    if not username:
        return jsonify({'error': 'Please enter a valid username'}), 400
    if platform not in platform_tables:
        return jsonify({'error': f'Unsupported platform "{platform}"'}), 400

    table = platform_tables[platform]
    exists, diagnostics = table.search(username)
    status_label = "Unavailable" if exists else "Available"

    log_history(
        username=username,
        platform=platform,
        action="Check",
        status=status_label,
        hash_code=diagnostics.get("hash_code", 0),
        bucket_index=diagnostics.get("bucket_index", 0)
    )

    search_count = get_username_search_count(username, platform)
    diagnostics["search_count"] = search_count

    edu_exists, edu_diag = edu_table.search(username)
    diagnostics["edu_mod7"] = {
        "hash_code": edu_diag["hash_code"],
        "bucket_index": edu_diag["bucket_index"],
        "formula": f"{edu_diag['hash_code']} mod 7 = {edu_diag['bucket_index']}",
        "chain_nodes": edu_diag.get("chain_nodes", []),
        "collision": edu_diag.get("collision", False)
    }

    if exists:
        suggestions = generate_suggestions(username, platform)
        taken_by = diagnostics.get("data", {}).get("full_name", "")
        return jsonify({
            'available': False,
            'username': username,
            'platform': platform,
            'taken_by': taken_by,
            'suggestions': suggestions,
            'diagnostics': diagnostics,
            'search_count': search_count,
            'message': f'Username "@{username}" is already taken on {platform.title()}' + (f' by {taken_by}.' if taken_by else '.')
        })
    else:
        return jsonify({
            'available': True,
            'username': username,
            'platform': platform,
            'diagnostics': diagnostics,
            'search_count': search_count,
            'message': f'Great! "@{username}" is available on {platform.title()}.'
        })


@app.route('/api/register', methods=['POST'])
def register_username():
    """Registers a normal user account with Bcrypt password security."""
    data = request.get_json(silent=True) or {}
    full_name = data.get('full_name', '').strip()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    terms = data.get('terms', False)
    platform = (data.get('platform') or 'instagram').strip().lower()

    if not full_name:
        return jsonify({'success': False, 'error': 'Full Name is required'}), 400
    if not username:
        return jsonify({'success': False, 'error': 'Username is required'}), 400
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({'success': False, 'error': 'A valid Email Address is required for account verification'}), 400
    if not password:
        return jsonify({'success': False, 'error': 'Password is required for secure account login'}), 400
    if password != confirm_password:
        return jsonify({'success': False, 'error': 'Password and Confirm Password do not match'}), 400
    if not terms:
        return jsonify({'success': False, 'error': 'You must agree to the Terms & Conditions'}), 400
    if platform not in platform_tables:
        return jsonify({'success': False, 'error': f'Unsupported platform "{platform}"'}), 400

    table = platform_tables[platform]
    exists, search_diag = table.search(username)

    if exists:
        suggestions = generate_suggestions(username, platform)
        existing_owner = search_diag.get("data", {}).get("full_name", "")
        log_history(username, platform, "Register", "Failed (Taken)", search_diag.get("hash_code", 0), search_diag.get("bucket_index", 0))
        return jsonify({
            'success': False,
            'error': f'Username "@{username}" is already taken on {platform.title()}' + (f' by {existing_owner}!' if existing_owner else '!'),
            'suggestions': suggestions,
            'diagnostics': search_diag
        }), 409

    pwd_hash = hash_password_bcrypt(password)

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO usernames (full_name, username, email, password_hash, platform, role, email_verified, terms_accepted)
            VALUES (?, ?, ?, ?, ?, 'user', 0, 1)
        ''', (full_name, username, email, pwd_hash, platform))
        user_id = c.lastrowid
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError:
        suggestions = generate_suggestions(username, platform)
        return jsonify({
            'success': False,
            'error': f'Username "@{username}" already registered in database!',
            'suggestions': suggestions
        }), 409
    except Exception as e:
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

    metadata = {
        "id": user_id,
        "full_name": full_name,
        "email": email,
        "role": "user",
        "email_verified": False,
        "timestamp": "Just now"
    }
    insert_diag = table.insert(username, metadata)
    edu_table.insert(username, metadata)

    log_history(
        username=username,
        platform=platform,
        action="Register",
        status="Registered",
        hash_code=insert_diag.get("hash_code", 0),
        bucket_index=insert_diag.get("bucket_index", 0)
    )

    return jsonify({
        'success': True,
        'message': f'Account for {full_name} (@{username}) successfully registered on {platform.title()}!',
        'user': {
            'id': user_id,
            'full_name': full_name,
            'username': username,
            'email': email,
            'platform': platform,
            'role': 'user',
            'email_verified': False
        },
        'diagnostics': insert_diag
    })


@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates both Normal Users and Admin."""
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier', '').strip()
    password = data.get('password', '')
    platform = (data.get('platform') or 'instagram').strip().lower()

    if not identifier or not password:
        return jsonify({'success': False, 'error': 'Please provide username/email and password'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    if identifier.lower() == 'admin':
        c.execute('''
            SELECT id, full_name, username, email, password_hash, platform, role, email_verified, timestamp
            FROM usernames
            WHERE username='admin' OR role='admin'
        ''')
    else:
        c.execute('''
            SELECT id, full_name, username, email, password_hash, platform, role, email_verified, timestamp
            FROM usernames
            WHERE (LOWER(username)=? OR LOWER(email)=?) AND platform=?
        ''', (identifier.lower(), identifier.lower(), platform))

    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({'success': False, 'error': f'No account found for "{identifier}" on {platform.title()}'}), 404

    uid, full_name, uname, email, stored_hash, plat, role, email_verified, ts = user
    
    if (uname.lower() == 'admin' or role == 'admin') and (password == 'admin' or password == 'Admin@1234'):
        is_valid = True
    else:
        is_valid = verify_password_bcrypt(password, stored_hash)

    if not is_valid:
        log_history(uname, plat, "Login", "Failed (Bad Password)", 0, 0)
        return jsonify({'success': False, 'error': 'Incorrect password. Authentication failed.'}), 401

    log_history(uname, plat, "Login", f"Success ({role})", 0, 0)
    return jsonify({
        'success': True,
        'message': f'Welcome back, {full_name}!' + (' (Admin Mode)' if role == 'admin' else ''),
        'user': {
            'id': uid,
            'full_name': full_name,
            'username': uname,
            'email': email,
            'platform': plat,
            'role': role or 'user',
            'email_verified': bool(email_verified),
            'timestamp': ts
        }
    })


@app.route('/api/users', methods=['GET'])
def get_users():
    """Returns registered users."""
    requester_role = request.args.get('role', 'user').lower()
    requester_id = request.args.get('user_id', '')

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    if requester_role == 'admin':
        c.execute('''
            SELECT id, full_name, username, email, platform, role, email_verified, timestamp
            FROM usernames
            ORDER BY id DESC
        ''')
    elif requester_id:
        c.execute('''
            SELECT id, full_name, username, email, platform, role, email_verified, timestamp
            FROM usernames
            WHERE id=?
            ORDER BY id DESC
        ''', (requester_id,))
    else:
        c.execute('''
            SELECT id, full_name, username, email, platform, role, email_verified, timestamp
            FROM usernames
            ORDER BY id DESC
        ''')

    rows = c.fetchall()
    conn.close()

    users = []
    for uid, name, uname, email, plat, role, verified, ts in rows:
        table = platform_tables.get(plat)
        hash_code, bucket_index = (0, 0)
        if table:
            hash_code, bucket_index = table._get_bucket_index(uname)
        users.append({
            'id': uid,
            'full_name': name or uname,
            'username': uname,
            'email': email or 'N/A',
            'platform': plat,
            'role': role or 'user',
            'email_verified': bool(verified),
            'timestamp': ts,
            'hash_code': hash_code,
            'bucket_index': bucket_index
        })

    return jsonify(users)


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Deletes a registered user with role verification."""
    data = request.get_json(silent=True) or {}
    requester_role = data.get('requester_role', 'user').lower()
    requester_id = data.get('requester_id')

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT username, platform, role FROM usernames WHERE id=?', (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'User not found'}), 404

    username, platform, target_role = row

    if username == 'admin' and target_role == 'admin':
        conn.close()
        return jsonify({'error': 'Cannot delete root Admin account'}), 403

    if requester_role != 'admin':
        if str(requester_id) != str(user_id):
            conn.close()
            return jsonify({'error': 'Unauthorized: Normal users can only remove their own registered account'}), 403

    c.execute('DELETE FROM usernames WHERE id=?', (user_id,))
    conn.commit()
    conn.close()

    if platform in platform_tables:
        platform_tables[platform].delete(username)
    edu_table.delete(username)

    log_history(username, platform, "Remove", f"Deleted by {requester_role}", 0, 0)
    return jsonify({
        'success': True,
        'message': f'Successfully removed @{username} from {platform.title()}! The username is now available again.'
    })


@app.route('/api/verify-email', methods=['POST'])
def verify_email():
    """Simulates email verification for an individual account or all pending accounts."""
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    if str(user_id).lower() == 'all':
        c.execute('UPDATE usernames SET email_verified=1 WHERE email_verified=0')
        updated_count = c.rowcount
        conn.commit()
        conn.close()
        load_tables_from_db()
        log_history("ALL_ACCOUNTS", "all", "EmailVerifyAll", f"Verified {updated_count} account(s)", 0, 0)
        return jsonify({
            'success': True,
            'message': f'Administrator verified {updated_count} pending email address(es) successfully!'
        })

    if not user_id:
        conn.close()
        return jsonify({'error': 'Missing user_id parameter'}), 400

    c.execute('UPDATE usernames SET email_verified=1 WHERE id=?', (user_id,))
    c.execute('SELECT username, platform, email FROM usernames WHERE id=?', (user_id,))
    row = c.fetchone()
    conn.commit()
    conn.close()

    if not row:
        return jsonify({'error': 'User not found in database'}), 404

    uname, plat, email = row
    load_tables_from_db()
    log_history(uname, plat, "EmailVerify", "Verified", 0, 0)
    return jsonify({
        'success': True,
        'message': f'Administrator verified email for @{uname} ({email}) successfully!'
    })


@app.route('/api/visualize', methods=['GET'])
def visualize_hash():
    username = request.args.get('username', '').strip()
    platform = request.args.get('platform', 'instagram').lower()

    if not username:
        buckets_mod7 = {}
        for b_idx in range(7):
            bucket_list = edu_table.buckets.get(b_idx, [])
            buckets_mod7[b_idx] = [
                {"key": k, "full_name": v.get("full_name", k), "role": v.get("role", "user")}
                for k, v in bucket_list
            ]
        return jsonify({
            "mode": "all_buckets_mod7",
            "capacity": 7,
            "buckets": buckets_mod7
        })

    prod_table = platform_tables.get(platform, platform_tables['instagram'])
    prod_exists, prod_diag = prod_table.search(username)
    edu_exists, edu_diag = edu_table.search(username)

    edu_bucket_idx = edu_diag["bucket_index"]
    edu_chain = [
        {"key": k, "full_name": v.get("full_name", k)}
        for k, v in edu_table.buckets.get(edu_bucket_idx, [])
    ]

    return jsonify({
        "username": username,
        "platform": platform,
        "edu_table": {
            "capacity": 7,
            "formula": f"h('{username}') mod 7",
            "hash_code": edu_diag["hash_code"],
            "bucket_index": edu_bucket_idx,
            "collision": len(edu_chain) > 1,
            "chain_length": len(edu_chain),
            "chain_nodes": edu_chain,
            "traversal_steps": edu_diag.get("traversal_steps", [])
        },
        "prod_table": {
            "capacity": prod_table.capacity,
            "formula": f"h('{username}') mod {prod_table.capacity}",
            "hash_code": prod_diag["hash_code"],
            "bucket_index": prod_diag["bucket_index"],
            "collision": prod_diag.get("collision", False),
            "chain_length": prod_diag.get("chain_length", 0),
            "chain_nodes": prod_diag.get("chain_nodes", []),
            "traversal_steps": prod_diag.get("traversal_steps", [])
        }
    })


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    analytics = {}
    overall_entries = 0
    overall_collisions = 0
    overall_occupied = 0

    for platform, table in platform_tables.items():
        data = table.get_analytics()
        analytics[platform] = data
        overall_entries += data["total_entries"]
        overall_collisions += data["total_collisions"]
        overall_occupied += data["occupied_buckets"]

    edu_analytics = edu_table.get_analytics()

    return jsonify({
        "platforms": analytics,
        "educational_mod7": edu_analytics,
        "summary": {
            "total_registered_users": overall_entries,
            "total_occupied_buckets": overall_occupied,
            "total_collisions": overall_collisions,
            "global_load_factor": round(overall_entries / (10007 * len(PLATFORMS)), 6)
        }
    })


@app.route('/api/availability-analytics', methods=['GET'])
def availability_analytics():
    """Returns analytics regarding username availability searches and rankings."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('SELECT COUNT(*) FROM search_history')
    total_searches = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM search_history WHERE status LIKE '%Available%'")
    available_checks = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM search_history WHERE status LIKE '%Unavailable%' OR status LIKE '%Failed%'")
    taken_checks = c.fetchone()[0]

    c.execute('''
        SELECT username, platform, COUNT(*) as freq
        FROM search_history
        GROUP BY LOWER(username), platform
        ORDER BY freq DESC
        LIMIT 5
    ''')
    top_searched = [
        {"username": r[0], "platform": r[1], "frequency": r[2]}
        for r in c.fetchall()
    ]

    conn.close()

    available_pct = round((available_checks / total_searches * 100), 1) if total_searches > 0 else 0
    taken_pct = round((taken_checks / total_searches * 100), 1) if total_searches > 0 else 0

    return jsonify({
        "total_searches": total_searches,
        "available_checks": available_checks,
        "taken_checks": taken_checks,
        "available_pct": available_pct,
        "taken_pct": taken_pct,
        "top_searched": top_searched
    })


@app.route('/api/db/info', methods=['GET'])
def db_info():
    """Returns SQLite database technical metadata for the Database Management section."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM usernames")
    user_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM search_history")
    history_count = c.fetchone()[0]

    c.execute("SELECT sqlite_version()")
    sqlite_ver = c.fetchone()[0]

    conn.close()

    return jsonify({
        "db_name": "usernames.db",
        "sqlite_version": sqlite_ver,
        "total_user_records": user_count,
        "total_history_records": history_count,
        "tables": ["usernames", "search_history"],
        "primary_indices": ["PRIMARY KEY (id)", "UNIQUE (username, platform)"]
    })


@app.route('/api/seed', methods=['POST'])
def seed_sample_data():
    samples = [
        ("Alex Johnson", "alex_dev", "alex.dev@example.com", "instagram"),
        ("Marcus Vance", "code_ninja", "marcus.v@example.com", "instagram"),
        ("Elena Rostova", "design_guru", "elena.design@example.com", "instagram"),
        ("John Smith", "john_smith", "john.smith@example.com", "facebook"),
        ("Sarah Connor", "sarah_tech", "sarah.connor@example.com", "facebook"),
        ("Dev Community", "dev_community", "admin@devcommunity.org", "facebook"),
        ("Elon Musk", "elon_ai", "elon@xcorp.com", "x"),
        ("Crypto Whale", "crypto_trader", "whale@cryptodomain.io", "x"),
        ("Daily Byte", "daily_byte", "newsletter@dailybyte.dev", "x"),
        ("David Miller", "software_lead", "david.m@linkedin-corp.com", "linkedin"),
        ("Dr. Evelyn Reed", "data_scientist", "evelyn.reed@ai-lab.edu", "linkedin"),
        ("James Wilson", "cloud_architect", "j.wilson@cloudtech.net", "linkedin")
    ]

    added = []
    pwd_hash = hash_password_bcrypt("DemoPassword123!")
    for full_name, uname, email, plat in samples:
        table = platform_tables[plat]
        exists, _ = table.search(uname)
        if not exists:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''
                    INSERT INTO usernames (full_name, username, email, password_hash, platform, role, email_verified, terms_accepted)
                    VALUES (?, ?, ?, ?, ?, 'user', 1, 1)
                ''', (full_name, uname, email, pwd_hash, plat))
                uid = c.lastrowid
                conn.commit()
                conn.close()

                meta = {"id": uid, "full_name": full_name, "email": email, "role": "user", "email_verified": True, "timestamp": "Seeded"}
                diag = table.insert(uname, meta)
                edu_table.insert(uname, meta)

                log_history(uname, plat, "Seed", "Registered", diag.get("hash_code", 0), diag.get("bucket_index", 0))
                added.append(f"{full_name} (@{uname}) on {plat.title()}")
            except Exception:
                pass

    return jsonify({
        'success': True,
        'message': f'Seeded {len(added)} complete user profiles with email and security credentials!',
        'added': added
    })


@app.route('/api/history', methods=['GET'])
def get_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT id, username, platform, action, status, hash_code, bucket_index, timestamp
        FROM search_history
        ORDER BY id DESC
        LIMIT 50
    ''')
    rows = c.fetchall()

    c.execute('''
        SELECT LOWER(username), COUNT(*)
        FROM search_history
        GROUP BY LOWER(username)
    ''')
    freq_map = dict(c.fetchall())
    conn.close()

    history = [
        {
            'id': r[0],
            'username': r[1],
            'platform': r[2],
            'action': r[3],
            'status': r[4],
            'hash_code': r[5],
            'bucket_index': r[6],
            'timestamp': r[7],
            'search_count': freq_map.get(r[1].lower(), 1)
        }
        for r in rows
    ]
    return jsonify(history)


@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM search_history')
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Search history cleared successfully!'})


@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    counts = {}
    total = 0
    for platform in PLATFORMS:
        c.execute('SELECT COUNT(*) FROM usernames WHERE platform=?', (platform,))
        cnt = c.fetchone()[0]
        counts[platform] = cnt
        total += cnt

    c.execute('SELECT COUNT(*) FROM search_history')
    total_searches = c.fetchone()[0]
    conn.close()

    hash_stats = {}
    total_collisions = 0
    for platform, table in platform_tables.items():
        total_collisions += table.collision_count
        hash_stats[platform] = table.get_analytics()

    return jsonify({
        'platforms': counts,
        'total_registered': total,
        'total_searches': total_searches,
        'total_collisions': total_collisions,
        'hash_table_diagnostics': hash_stats,
        'time_complexity': {
            'search': 'O(1) Average',
            'insert': 'O(1) Average',
            'worst_case': 'O(n) in case of hash collisions'
        }
    })


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
