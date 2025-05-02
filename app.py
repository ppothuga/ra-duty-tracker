import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from models import db, RA

# Get absolute path for the database
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'ra_duty_tracker.db')

app = Flask(__name__)
# Use absolute path for SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
CORS(app)  # Enable CORS for all routes

# Helper function to get the database connection using the same path
def get_db_connection():
    return sqlite3.connect(db_path)

# Database setup function
def setup_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT
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
            (1, "Alex Smith", "alex.smith@example.edu"),
            (2, "Jordan Lee", "jordan.lee@example.edu"),
            (3, "Taylor Wong", "taylor.wong@example.edu"),
            (4, "Casey Johnson", "casey.johnson@example.edu")
        ]
        cursor.executemany("INSERT INTO ras (id, name, email) VALUES (?, ?, ?)", sample_ras)
    
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

def sync_ra_data():
    """Synchronize RA data between duties and RAs tables"""
    try:
        with app.app_context():
            # Get all RAs from duties table that might be missing in the RA table
            conn = get_db_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # This query gets all unique RA data from duties that don't exist in ras table
            cursor.execute("""
                SELECT DISTINCT d.ra_id, d.ra_name 
                FROM duties d
                LEFT JOIN ras r ON d.ra_id = r.id
                WHERE r.id IS NULL
            """)
            
            missing_ras = cursor.fetchall()
            
            # Add missing RAs to the RA table
            for ra_data in missing_ras:
                new_ra = RA(
                    id=ra_data['ra_id'],
                    name=ra_data['ra_name']
                )
                db.session.add(new_ra)
            
            cursor.execute("""
                SELECT DISTINCT d.ra_id, d.ra_name, r.name AS db_name
                FROM duties d
                JOIN ras r ON d.ra_id = r.id
                WHERE d.ra_name != r.name
            """)
            
            mismatched_ras = cursor.fetchall()
            conn.close()
            
            # Update mismatched RA names in the RA table
            for ra_data in mismatched_ras:
                ra = RA.query.get(ra_data['ra_id'])
                if ra:
                    ra.name = ra_data['ra_name']
            
            db.session.commit()
            print("RA data synchronized successfully")
    except Exception as e:
        print(f"Error synchronizing RA data: {str(e)}")
        db.session.rollback()

# Helper function to get or create an RA
def get_or_create_ra(name, email=''):
    """Get an existing RA by name or create a new one if it doesn't exist"""
    # Try to find the RA by name first
    ra = RA.query.filter(RA.name.ilike(name.strip())).first()
    
    if not ra:
        # Create new RA in the RA table
        ra = RA(
            name=name.strip(),
            email=email
        )
        db.session.add(ra)
        db.session.commit()
    
    return ra

# API Endpoints for duties
@app.route('/api/duties', methods=['GET'])
def get_duties():
    conn = get_db_connection()
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
    conn = get_db_connection()
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

    if not data.get('ra_name') or not data.get('date') or not data.get('shift'):
        return jsonify({"error": "RA name, date and shift are required"}), 400

    ra_name = data['ra_name'].strip()
    if not ra_name:
        return jsonify({"error": "RA name cannot be empty"}), 400

    try:
        # Use the helper function to get or create RA
        ra = get_or_create_ra(ra_name, data.get('ra_email', ''))
        ra_id = ra.id
        
        # Insert into duties table
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO duties (ra_id, ra_name, date, shift, notes) VALUES (?, ?, ?, ?, ?)",
            (ra_id, ra.name, data['date'], data['shift'], data.get('notes', ''))
        )
        duty_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"id": duty_id, "message": "Duty added successfully"}), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add duty: {str(e)}"}), 500

@app.route('/api/duties/<int:duty_id>', methods=['PUT'])
def update_duty(duty_id):
    data = request.json
    
    # Validate required fields
    if not data.get('ra_name') or not data.get('date') or not data.get('shift'):
        return jsonify({"error": "RA name, date and shift are required"}), 400
    
    ra_name = data['ra_name'].strip()
    
    try:
        # Use the helper function to get or create RA
        ra = get_or_create_ra(ra_name, data.get('ra_email', ''))
        ra_id = ra.id
        
        # Update duty
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if duty exists
        cursor.execute("SELECT id FROM duties WHERE id = ?", (duty_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Duty not found"}), 404
        
        cursor.execute(
            "UPDATE duties SET ra_id = ?, ra_name = ?, date = ?, shift = ?, notes = ? WHERE id = ?",
            (ra_id, ra.name, data['date'], data['shift'], data.get('notes', ''), duty_id)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Duty updated successfully"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update duty: {str(e)}"}), 500

@app.route('/api/duties/<int:duty_id>', methods=['DELETE'])
def delete_duty(duty_id):
    conn = get_db_connection()
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
    try:
        # Get all RAs
        ras = RA.query.order_by(RA.name).all()
            
        return jsonify([ra.to_dict() for ra in ras])
    except Exception as e:
        print(f"Error fetching RAs: {str(e)}")
        return jsonify({"error": "Failed to retrieve RAs"}), 500

@app.route('/api/ras/<int:ra_id>', methods=['GET'])
def get_ra(ra_id):
    try:
        ra = RA.query.get(ra_id)
        if not ra:
            return jsonify({"error": "RA not found"}), 404
        return jsonify(ra.to_dict())
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve RA: {str(e)}"}), 500
    
@app.route('/api/ras', methods=['POST'])
def add_ra():
    try:
        print("===== ADDING NEW RA - START =====")
        data = request.json
        print(f"Received data: {data}")
        
        if not data.get('name'):
            print("Error: RA name is required")
            return jsonify({"error": "RA name is required"}), 400
            
        ra_name = data['name'].strip()
        if not ra_name:
            print("Error: RA name cannot be empty after stripping")
            return jsonify({"error": "RA name cannot be empty"}), 400
            
        # Check if RA with this name already exists (case-insensitive)
        existing_ra = RA.query.filter(RA.name.ilike(ra_name)).first()
        if existing_ra:
            print(f"Found existing RA: {existing_ra.id}, {existing_ra.name}")
            return jsonify({"error": "An RA with this name already exists"}), 409
            
        # Create new RA object with only supported fields
        ra = RA(
            name=ra_name,
            email=data.get('email', '')
        )
        
        # Print database details for debugging
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ras")
            existing_records = cursor.fetchall()
            print(f"Current records in ras table: {existing_records}")
        
        print("Adding RA to session")
        db.session.add(ra)
        print("Committing session")
        db.session.commit()
        
        # Verify the RA was added correctly
        print(f"New RA created with ID: {ra.id}, Name: {ra.name}")
        
        # Double-check it exists in the database
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ras WHERE id = ?", (ra.id,))
            result = cursor.fetchone()
            print(f"Verification query result: {result}")
            
            # List all RAs in the database
            cursor.execute("SELECT * FROM ras")
            all_ras = cursor.fetchall()
            print(f"All RAs after adding: {all_ras}")
        
        # Update any duties that might have similar names but different case
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE duties SET ra_id = ?, ra_name = ? WHERE LOWER(ra_name) = LOWER(?)",
            (ra.id, ra.name, ra.name)
        )
        conn.commit()
        conn.close()
        
        print("===== ADDING NEW RA - END =====")
        return jsonify(ra.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"ERROR adding RA: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to add RA: {str(e)}"}), 500

@app.route('/api/ras/<int:ra_id>', methods=['PUT'])
def update_ra(ra_id):
    try:
        ra = RA.query.get(ra_id)
        if not ra:
            return jsonify({"error": "RA not found"}), 404
            
        data = request.json
        if not data.get('name'):
            return jsonify({"error": "RA name is required"}), 400
        
        new_name = data['name'].strip()
        if not new_name:
            return jsonify({"error": "RA name cannot be empty"}), 400
            
        # Check if another RA with this name already exists (case-insensitive)
        existing_ra = RA.query.filter(RA.name.ilike(new_name)).first()
        if existing_ra and existing_ra.id != ra_id:
            return jsonify({"error": "Another RA with this name already exists"}), 409
        
        old_name = ra.name
            
        # Update RA properties - only supported fields
        ra.name = new_name
        ra.email = data.get('email', ra.email)
        
        db.session.commit()
        
        # Update ra_name in duties table if the name changed
        if old_name.lower() != new_name.lower():
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE duties SET ra_name = ? WHERE ra_id = ?",
                (new_name, ra_id)
            )
            conn.commit()
            conn.close()
        
        return jsonify(ra.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update RA: {str(e)}"}), 500
    
@app.route('/api/ras/<int:ra_id>', methods=['DELETE'])
def delete_ra(ra_id):
    try:
        ra = RA.query.get(ra_id)
        if not ra:
            return jsonify({"error": "RA not found"}), 404
            
        # Check if RA has any duties
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM duties WHERE ra_id = ?", (ra_id,))
        has_duties = cursor.fetchone()[0] > 0
        conn.close()
        
        if has_duties:
            return jsonify({"error": "Cannot delete RA with associated duties"}), 400
        else:
            # Delete if no duties are associated
            db.session.delete(ra)
            db.session.commit()
            message = "RA deleted successfully"
        
        return jsonify({"message": message})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete RA: {str(e)}"}), 500

# Reports endpoints
@app.route('/api/reports/ra-duties', methods=['GET'])
def ra_duties_report():
    conn = get_db_connection()
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
    conn = get_db_connection()
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

# Debugging endpoint to examine database
@app.route('/api/debug/database', methods=['GET'])
def debug_database():
    try:
        data = {}
        
        # Get RAs from SQLAlchemy
        ras_sqlalchemy = [ra.to_dict() for ra in RA.query.all()]
        data['ras_sqlalchemy'] = ras_sqlalchemy
        
        # Get RAs directly from SQLite
        with get_db_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row['name'] for row in cursor.fetchall()]
            data['tables'] = tables
            
            # Get RAs from SQLite
            cursor.execute("SELECT * FROM ras")
            ras_sqlite = [dict(row) for row in cursor.fetchall()]
            data['ras_sqlite'] = ras_sqlite
            
            # Get some duties too
            cursor.execute("SELECT * FROM duties LIMIT 10")
            duties = [dict(row) for row in cursor.fetchall()]
            data['duties_sample'] = duties
            
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Debug error: {str(e)}"}), 500

# Initialize the application
with app.app_context():
    db.create_all()
    setup_database()
    sync_ra_data()  # Do an initial sync to ensure consistency

if __name__ == '__main__':
    app.run(debug=True, port=5001)