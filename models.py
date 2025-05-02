from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy instance
db = SQLAlchemy()

class RA(db.Model):
    __tablename__ = 'ras'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String)
    
    # Define the relationship with Duty model
    duties = db.relationship('Duty', backref='ra_object', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert RA object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email
        }
    
    @classmethod
    def find_by_name(cls, name):
        """Find an RA by name (case-insensitive)"""
        return cls.query.filter(cls.name.ilike(name.strip())).first()

class Duty(db.Model):
    __tablename__ = 'duties'
    
    id = db.Column(db.Integer, primary_key=True)
    ra_id = db.Column(db.Integer, db.ForeignKey('ras.id'), nullable=False)
    ra_name = db.Column(db.String, nullable=False)
    date = db.Column(db.String, nullable=False)
    shift = db.Column(db.String, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.String, default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    def to_dict(self):
        """Convert Duty object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'ra_id': self.ra_id,
            'ra_name': self.ra_name,
            'date': self.date,
            'shift': self.shift,
            'notes': self.notes,
            'created_at': self.created_at
        }
    
    @classmethod
    def get_duties_by_date_range(cls, start_date=None, end_date=None, ra_name=None):
        """Get duties filtered by date range and/or RA name"""
        query = cls.query
        
        if start_date:
            query = query.filter(cls.date >= start_date)
        
        if end_date:
            query = query.filter(cls.date <= end_date)
            
        if ra_name:
            query = query.filter(cls.ra_name.ilike(f"%{ra_name}%"))
            
        return query.order_by(cls.date).all()