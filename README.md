# AratKain ☕🍽️

**AratKain** is a web-based cafe and restaurant navigator that helps users easily find nearby cafes and restaurants. The application allows users to explore dining options, view locations, and manage their personal accounts.

## 📌 Project Description

AratKain is designed to make it easier for users to discover places to eat around them. The platform provides a simple and intuitive interface where users can search for nearby cafes and restaurants, save their favorite locations, and manage their profiles.

This system is built as a **web application** with a modern frontend and a scalable backend architecture.

## 🚀 Features

- User registration and login
- Browse nearby cafes and restaurants
- Save favorite restaurants
- Update user profile
- Location-based restaurant discovery
- Secure authentication system
- Responsive web interface

## 🛠️ Technologies Used

### Frontend
- **TypeScript**
- HTML
- CSS
- JavaScript

### Backend
- **Java**
- **Maven**
- REST API

### Tools
- Git & GitHub
- Visual Studio Code
- Maven Build Tool

## 📂 Project Structure
aratkain/
│
├── frontend/ # Frontend source code (TypeScript)
│
├── backend/ # Java Maven backend application
│
├── README.md
│
└── docs/ # Project documentation (if applicable)

## ⚙️ Installation and Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/aratkain.git
cd aratkain

## ⚙️ Installation and Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/aratkain.git
cd aratkain
2️⃣ Setup the Backend (Java Maven)

Navigate to the backend folder:

cd backend

Build the project using Maven:

mvn clean install

Run the backend server:

mvn spring-boot:run
3️⃣ Setup the Frontend

Navigate to the frontend folder:

cd frontend

Install dependencies:

npm install

Run the development server:

npm run dev
📸 System Modules

Authentication Module

Restaurant & Cafe Locator

Favorites Management

User Profile Management

Location Services

🎯 Purpose of the Project

This project was developed as part of an academic requirement to demonstrate the use of modern web development technologies, combining a TypeScript frontend with a Java Maven backend to create a functional location-based restaurant discovery system.

👨‍💻 Developers

Developed by students of the Bachelor of Science in Information Technology (BSIT).

📄 License

This project is for educational purposes only.


✅ This README is **good enough for a college project** and looks professional on GitHub.

If you want, I can also help you add these to make it **even better for GitHub**:
- **system architecture diagram**
- **API documentation section**
- **screenshots section**
- **deployment instructions** (this makes projects look more professional).
aratkain-backend/
│
├── src/
│   ├── main/
│   │   ├── java/com/aratkain/
│   │   │   ├── config/         # Security configuration
│   │   │   ├── controller/     # REST controllers
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   ├── entity/         # Database entities
│   │   │   ├── exception/      # Exception handling
│   │   │   ├── repository/     # Data repositories
│   │   │   ├── security/       # JWT filter and utilities
│   │   │   └── service/        # Business logic
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│
├── pom.xml
└── README.md
## ⚙️ Installation and Setup

### 1️⃣ Prerequisites

- Java 17+
- Maven 3.8+

### 2️⃣ Clone the repository

```bash
git clone https://github.com/Mikol-0519/AratKain-Backend.git
cd AratKain-Backend
```

### 3️⃣ Configure application properties

Edit `src/main/resources/application.properties` with your database and JWT settings:

```properties
spring.datasource.url=your_database_url
spring.datasource.username=your_username
spring.datasource.password=your_password
jwt.secret=your_jwt_secret
```

### 4️⃣ Build and Run

```bash
mvn clean install
mvn spring-boot:run
```

The server will start at `http://localhost:8080`.

## 📸 API Modules

- **Auth Module** — Register, Login, JWT token management
- **Establishment Module** — Cafe and restaurant data
- **Profile Module** — User profile management

## 🎯 Purpose of the Project

This backend was developed as part of an academic requirement, demonstrating the use of Java Spring Boot to build a secure and scalable REST API for a location-based restaurant discovery system.

## 👨‍💻 Developers

Mikel Josh A. Nicer

## 📄 License

