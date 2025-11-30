# 📚 Flashcard App

> A modern, premium web-based flashcard application built with React & Vite. Turn your CSV notes into interactive study cards instantly.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg?style=flat&logo=vite)

## ✨ Features

- **📂 CSV Import**: Drag & drop support for any CSV file.
- **🔄 Smart Column Mapping**: flexible mapping for Front (Question), Back (Answer), and Category columns.
- **💾 Local Persistence**: Your cards and progress are automatically saved to your browser's local storage.
- **📊 Library View**: Overview of your deck statistics with powerful filtering options.
- **🎯 Advanced Review**: Filter study sessions by **Category** or **Difficulty** (e.g., "Review only Hard cards").
- **🧠 Spaced Repetition Style**: Rate cards as Easy, Medium, or Hard. "Hard" cards are automatically requeued in the current session.
- **🎨 Premium UI**: Beautiful glassmorphism design, 3D card flips, and fully responsive layout for mobile & desktop.
- **⌨️ Keyboard Shortcuts**: Optimized for power users (Space to flip, Arrows to navigate, 1-3 for rating).

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
- **Deployment**: GitHub Actions & GitHub Pages

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YOUR_USERNAME/flashcard-app.git
    cd flashcard-app
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```
    Open http://localhost:5173 to view it in the browser.

## 📖 Usage

1.  **Upload Data**: Drag and drop a CSV file containing your flashcard data.
2.  **Map Columns**: Select which columns correspond to the **Front** (Question), **Back** (Answer), and optionally **Category**.
3.  **Study**:
    -   **Space / Click**: Flip card
    -   **Left / Right Arrow**: Previous / Next card
    -   **1 / 2 / 3**: Rate as Easy / Medium / Hard
4.  **Review**: Go to the **Library** view to see stats and start targeted review sessions (e.g., "Math" category, "Hard" difficulty only).

## 📦 Deployment

This project is configured for automatic deployment to **GitHub Pages**.

1.  Push your code to a GitHub repository.
2.  Go to **Settings > Pages** in your repository.
3.  Under **Build and deployment**, select **GitHub Actions** as the source.
4.  The included `.github/workflows/deploy.yml` will automatically build and deploy your app on every push to `main`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
