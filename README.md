# Certificate Management System

A certificate management system for generating, managing, and verifying digital certificates.

**Stack:** Node.js + Express + PostgreSQL + Angular 17 + Docker

---

## 🚀 Quick Start

### Run with One Command

```bash
docker compose up -d --build
```

That's it! Wait 2-3 minutes for first build, then access:

- **Frontend**: http://localhost:4200
- **API**: http://localhost:3000/api/health
- **Database**: localhost:5433

### Stop Application

```bash
docker compose down
```

---

## 🧪 Running Tests

### Backend Tests

```bash
# Run all tests
docker exec certificate_api npm test

```

**Current Coverage:** 76.87% (35/38 tests passing)

---

## 📖 Usage

### 1. Register Your Company

1. Go to http://localhost:4200/register
2. Fill in company details
3. **Save the API Key and Secret** (shown only once!)

### 2. Login

1. Go to http://localhost:4200/login
2. Use your email and password

### 3. Create a Template

1. Navigate to **Templates** → **Create Template**
2. Define template name and fields
3. Fields are placeholders (e.g., `recipientName`, `courseName`)

### 4. Generate Certificates

**Via UI:**

- Go to **Certificates** → **Generate**
- Select template and fill in data

**Via API:**

```bash
curl -X POST http://localhost:3000/api/certificates/batch-generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET" \
  -d '{
    "templateId": "your-template-id",
    "certificates": [
      {
        "recipientName": "John Doe",
        "courseName": "Web Development",
        "completionDate": "2024-02-09"
      }
    ]
  }'
```

---

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (JWT required)

### Templates (JWT Auth)

- `POST /api/templates` - Create template
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Certificates

- `POST /api/certificates/simulate` - Preview certificate (JWT)
- `POST /api/certificates/generate-ui` - Generate via UI (JWT)
- `POST /api/certificates/generate` - Generate via API (API Key)
- `POST /api/certificates/batch-generate` - Batch generate (API Key)
- `GET /api/certificates` - List certificates (JWT)
- `GET /api/certificates/:id/download` - Download PDF (JWT)
- `GET /api/certificates/verify/:token` - Verify certificate (public)
- `PUT /api/certificates/:id/revoke` - Revoke certificate (JWT)

---

## 🔒 Authentication

### UI Access (JWT)

Used by the Angular frontend:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in requests
curl http://localhost:3000/api/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Access (API Key + Secret)

Used for programmatic certificate generation:

```bash
curl -X POST http://localhost:3000/api/certificates/generate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"uuid","data":{"recipientName":"John"}}'
```

---

## 🔧 Development Commands

### Rebuild Frontend (without cache)

```bash
docker compose build --no-cache frontend && docker compose up -d frontend
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f frontend
```

### Access Database

```bash
docker exec -it certificate_db psql -U postgres -d certificate_db
```

---

## 🎯 Features

✅ Customer registration and authentication
✅ Certificate template management
✅ Single and batch certificate generation
✅ PDF certificate download
✅ Certificate verification with digital signatures
✅ API key authentication for programmatic access
✅ Template isolation (customers only see their own)
✅ Certificate revocation

---
