# Ackontant - Personal Accounting Web Application

A modern, secure, and user-friendly personal accounting web application that helps users manage their finances across multiple currencies and accounts. I've tried building this several times. but never had enough time. trying out vibe coding for myself

## Features

- Multi-currency support with real-time exchange rates
- Multiple account types (Bank, Cash, Mobile Money, Credit Card)
- Transaction tracking with categorization and tagging
- Social authentication (Google, Facebook, GitHub, Apple)
- Email verification and password reset
- Responsive design for all devices

## Tech Stack

### Backend
- Python 3.12.2
- Django 5.0.2
- Django REST Framework 3.14.0
- PostgreSQL 16.2
- Redis (for caching)

### Frontend
- Node.js 20.11.1 LTS
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.1.3
- Zustand (State Management)

## Prerequisites

- Python 3.12.2 or higher
- Node.js 20.11.1 LTS or higher
- PostgreSQL 16.2 or higher
- Git

## Local Development Setup

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/KwakuBoohene/ackontant.git
   cd ackontant
   ```

2. Create and activate virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run migrations
   ```bash
   python manage.py migrate
   ```

6. Create superuser
   ```bash
   python manage.py createsuperuser
   ```

7. Run development server
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run development server
   ```bash
   npm run dev
   ```

## Project Structure

```
ackontant/
├── backend/                 # Django backend
│   ├── accounts/           # User accounts app
│   ├── transactions/       # Transactions app
│   ├── core/              # Core functionality
│   └── api/               # API endpoints
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript types
│   └── public/           # Static files
└── docs/                 # Project documentation
```

## Authentication

The application supports multiple authentication methods:

1. Email/Password authentication
2. Social authentication:
   - Google
   - Facebook
   - GitHub
   - Apple

Users can:
- Register with email/password
- Connect multiple social accounts
- Reset password
- Verify email address
- Manage connected social accounts

## API Documentation

API documentation is available at `/api/docs/` when running the development server.

### Key Endpoints

- `/api/auth/` - Authentication endpoints
- `/api/accounts/` - Account management
- `/api/transactions/` - Transaction management
- `/api/currencies/` - Currency and exchange rate management
- `/api/tags/` - Tag management

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```



## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Code Style

- Backend: Follow PEP 8 guidelines
- Frontend: Follow Airbnb JavaScript Style Guide
- Use TypeScript for all frontend code
- Write tests for new features


## License

This project is licensed under the MIT License - see the LICENSE file for details.



## Acknowledgments

- Django REST Framework
- React
- TypeScript
- Vite
- Zustand
- All other open-source libraries used in this project 