# Contributing to Aimify

First off, thank you for considering contributing to Aimify! It's people like you that make Aimify such a great tool.

## Setting up your Dev Environment

1. Fork the repo and clone it locally.
2. Follow the Quick Start instructions in the `README.md` to set up the database, backend, and frontend.
3. Make sure you create your own `backend/.env` file with functional API keys for Gemini and Groq.

## How to submit a PR

1. Create a new branch for your feature (`git checkout -b feature/AmazingFeature`).
2. Make your changes and test them locally.
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request on GitHub.

## Code Style Guidelines

- **Backend (Python):** We follow standard PEP 8 conventions. Use type hints for all function signatures.
- **Frontend (React):** We use functional components and hooks. Tailwind CSS is used for styling; avoid custom CSS where Tailwind utilities suffice.
- Please ensure your commit messages are descriptive and follow a conventional format (e.g., `feat:`, `fix:`, `docs:`).

## How to report bugs

If you find a bug, please create an issue on GitHub using the provided Bug Report template in `.github/ISSUE_TEMPLATE/bug_report.md`. Provide as much detail as possible, including logs, screenshots, and steps to reproduce.
