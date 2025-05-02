# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup function
def setup_database():
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        hall TEXT,
        active INTEGER DEFAULT 1
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS duties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ra_id INTEGER NOT NULL,
        ra_name TEXT NOT NULL,
        date TEXT NOT NULL,
        shift TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ra_id) REFERENCES ras (id) ON DELETE CASCADE
    )
    ''')
    
    # Insert sample data if the database is empty
    cursor.execute("SELECT COUNT(*) FROM ras")
    if cursor.fetchone()[0] == 0:
        sample_ras = [
            (1, "Alex Smith", "alex.smith@example.edu", "555-123-4567", "East Hall", 1),
            (2, "Jordan Lee", "jordan.lee@example.edu", "555-234-5678", "West Hall", 1),
            (3, "Taylor Wong", "taylor.wong@example.edu", "555-345-6789", "North Hall", 1),
            (4, "Casey Johnson", "casey.johnson@example.edu", "555-456-7890", "South Hall", 1)
        ]
        cursor.executemany("INSERT INTO ras (id, name, email, phone, hall, active) VALUES (?, ?, ?, ?, ?, ?)", sample_ras)
    
    cursor.execute("SELECT COUNT(*) FROM duties")
    if cursor.fetchone()[0] == 0:
        sample_duties = [
            (1, 1, "Alex Smith", "2025-03-28", "Secondary", "Main entrance duty"),
            (2, 2, "Jordan Lee", "2025-03-29", "Tertiary", "Weekend patrol"),
            (3, 3, "Taylor Wong", "2025-03-30", "Primary", "Mail room coverage"),
            (4, 4, "Casey Johnson", "2025-04-01", "Secondary", "Front desk")
        ]
        cursor.executemany("INSERT INTO duties (id, ra_id, ra_name, date, shift, notes) VALUES (?, ?, ?, ?, ?, ?)", sample_duties)
    
    conn.commit()
    conn.close()

# Initialize database on startup
setup_database()

# API Endpoints for duties
@app.route('/api/duties', methods=['GET'])
def get_duties():
    conn = sqlite3.connect('ra_duty_tracker.db')
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()
    
    # Get filter parameters
    ra_filter = request.args.get('ra', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    query = "SELECT * FROM duties WHERE 1=1"
    params = []
    
    if ra_filter:
        query += " AND ra_name LIKE ?"
        params.append(f"%{ra_filter}%")
    
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    
    query += " ORDER BY date"
    
    cursor.execute(query, params)
    duties = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(duties)

@app.route('/api/duties/<int:duty_id>', methods=['GET'])
def get_duty(duty_id):
    conn = sqlite3.connect('ra_duty_tracker.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM duties WHERE id = ?", (duty_id,))
    duty = cursor.fetchone()
    
    conn.close()
    
    if duty is None:
        return jsonify({"error": "Duty not found"}), 404
    
    return jsonify(dict(duty))

@app.route('/api/duties', methods=['POST'])
def add_duty():
    data = request.json
    
    # Validate required fields
    if not data.get('ra_name') or not data.get('date') or not data.get('shift'):
        return jsonify({"error": "RA name, date and shift are required"}), 400
    
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    # Get ra_id from name if available, otherwise use a default
    cursor.execute("SELECT id FROM ras WHERE name = ?", (data['ra_name'],))
    ra_result = cursor.fetchone()
    
    ra_id = ra_result[0] if ra_result else 0
    
    cursor.execute(
        "INSERT INTO duties (ra_id, ra_name, date, shift, notes) VALUES (?, ?, ?, ?, ?)",
        (ra_id, data['ra_name'], data['date'], data['shift'], data.get('notes', ''))
    )
    
    duty_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"id": duty_id, "message": "Duty added successfully"}), 201

@app.route('/api/duties/<int:duty_id>', methods=['PUT'])
def update_duty(duty_id):
    data = request.json
    
    # Validate required fields
    if not data.get('ra_name') or not data.get('date') or not data.get('shift'):
        return jsonify({"error": "RA name, date and shift are required"}), 400
    
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    # Check if duty exists
    cursor.execute("SELECT id FROM duties WHERE id = ?", (duty_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Duty not found"}), 404
    
    # Get ra_id from name if available
    cursor.execute("SELECT id FROM ras WHERE name = ?", (data['ra_name'],))
    ra_result = cursor.fetchone()
    
    ra_id = ra_result[0] if ra_result else 0
    
    cursor.execute(
        "UPDATE duties SET ra_id = ?, ra_name = ?, date = ?, shift = ?, notes = ? WHERE id = ?",
        (ra_id, data['ra_name'], data['date'], data['shift'], data.get('notes', ''), duty_id)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Duty updated successfully"})

@app.route('/api/duties/<int:duty_id>', methods=['DELETE'])
def delete_duty(duty_id):
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    # Check if duty exists
    cursor.execute("SELECT id FROM duties WHERE id = ?", (duty_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Duty not found"}), 404
    
    cursor.execute("DELETE FROM duties WHERE id = ?", (duty_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Duty deleted successfully"})

# API Endpoints for RAs
@app.route('/api/ras', methods=['GET'])
def get_ras():
    conn = sqlite3.connect('ra_duty_tracker.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get only active RAs by default, unless specified
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    if include_inactive:
        cursor.execute("SELECT * FROM ras ORDER BY name")
    else:
        cursor.execute("SELECT * FROM ras WHERE active = 1 ORDER BY name")
    
    ras = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(ras)

@app.route('/api/ras/<int:ra_id>', methods=['GET'])
def get_ra(ra_id):
    conn = sqlite3.connect('ra_duty_tracker.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM ras WHERE id = ?", (ra_id,))
    ra = cursor.fetchone()
    
    conn.close()
    
    if ra is None:
        return jsonify({"error": "RA not found"}), 404
    
    return jsonify(dict(ra))

@app.route('/api/ras', methods=['POST'])
def add_ra():
    data = request.json
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({"error": "RA name is required"}), 400
    
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO ras (name, email, phone, hall, active) VALUES (?, ?, ?, ?, ?)",
        (data['name'], data.get('email', ''), data.get('phone', ''), 
         data.get('hall', ''), data.get('active', 1))
    )
    
    ra_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"id": ra_id, "message": "RA added successfully"}), 201

@app.route('/api/ras/<int:ra_id>', methods=['PUT'])
def update_ra(ra_id):
    data = request.json
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({"error": "RA name is required"}), 400
    
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    # Check if RA exists
    cursor.execute("SELECT id FROM ras WHERE id = ?", (ra_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "RA not found"}), 404
    
    cursor.execute(
        "UPDATE ras SET name = ?, email = ?, phone = ?, hall = ?, active = ? WHERE id = ?",
        (data['name'], data.get('email', ''), data.get('phone', ''), 
         data.get('hall', ''), data.get('active', 1), ra_id)
    )
    
    # If the RA name changed, update it in the duties table
    if 'name' in data:
        cursor.execute(
            "UPDATE duties SET ra_name = ? WHERE ra_id = ?",
            (data['name'], ra_id)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "RA updated successfully"})

@app.route('/api/ras/<int:ra_id>', methods=['DELETE'])
def delete_ra(ra_id):
    conn = sqlite3.connect('ra_duty_tracker.db')
    cursor = conn.cursor()
    
    # Check if RA exists
    cursor.execute("SELECT id FROM ras WHERE id = ?", (ra_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "RA not found"}), 404
    
    # Check if RA has any duties
    cursor.execute("SELECT COUNT(*) FROM duties WHERE ra_id = ?", (ra_id,))
    if cursor.fetchone()[0] > 0:
        # Instead of hard delete, set the RA as inactive
        cursor.execute("UPDATE ras SET active = 0 WHERE id = ?", (ra_id,))
        message = "RA marked as inactive (has associated duties)"
    else:
        # Hard delete if no duties are associated
        cursor.execute("DELETE FROM ras WHERE id = ?", (ra_id,))
        message = "RA deleted successfully"
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": message})

# Reports endpoints
@app.route('/api/reports/ra-duties', methods=['GET'])
def ra_duties_report():
    conn = sqlite3.connect('ra_duty_tracker.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    query = """
    SELECT ra_name, COUNT(*) as total_duties,
           SUM(CASE WHEN shift = 'Primary' THEN 1 ELSE 0 END) as primary_count,
           SUM(CASE WHEN shift = 'Secondary' THEN 1 ELSE 0 END) as secondary_count,
           SUM(CASE WHEN shift = 'Tertiary' THEN 1 ELSE 0 END) as tertiary_count
    FROM duties
    """
    
    params = []
    where_clause = []
    
    if start_date:
        where_clause.append("date >= ?")
        params.append(start_date)
    
    if end_date:
        where_clause.append("date <= ?")
        params.append(end_date)
    
    if where_clause:
        query += " WHERE " + " AND ".join(where_clause)
    
    query += " GROUP BY ra_name ORDER BY total_duties DESC"
    
    cursor.execute(query, params)
    report = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(report)

@app.route('/api/reports/monthly-summary', methods=['GET'])
def monthly_summary():
    conn = sqlite3.connect('ra_duty_tracker.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    year = request.args.get('year', datetime.now().year)
    
    query = """
    SELECT 
        strftime('%m', date) as month,
        COUNT(*) as total_duties,
        SUM(CASE WHEN shift = 'Primary' THEN 1 ELSE 0 END) as primary_count,
        SUM(CASE WHEN shift = 'Secondary' THEN 1 ELSE 0 END) as secondary_count,
        SUM(CASE WHEN shift = 'Tertiary' THEN 1 ELSE 0 END) as tertiary_count
    FROM duties
    WHERE strftime('%Y', date) = ?
    GROUP BY month
    ORDER BY month
    """
    
    cursor.execute(query, (str(year),))
    report = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(report)

if __name__ == '__main__':
    app.run(debug=True, port=5001)