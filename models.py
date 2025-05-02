from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class RA(db.Model):
    __tablename__ = 'ras'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email
        }