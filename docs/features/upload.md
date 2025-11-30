# Upload & Sync

There are two ways to get your flashcards into the app.

## 1. Drag & Drop (Local Only)

For quick, temporary study sessions:

1.  Open the app in your browser.
2.  **Drag and drop** your `.csv` file into the upload zone.
3.  **Map your columns**: Select which column is the "Front" (Question) and "Back" (Answer).
4.  Start studying!

> **Note**: These cards are saved to your browser's local storage. If you clear your cache or switch devices, they will disappear.

## 2. Multi-File Sync (Recommended)

To access your cards on **all devices** (phone, tablet, computer):

1.  Place your CSV files (e.g., `english.csv`, `history.csv`) in the `src/assets/data/` folder of the project.
2.  **Push to GitHub**:
    ```bash
    git add .
    git commit -m "Add new cards"
    git push
    ```
3.  Wait a few minutes for the deployment to finish.
4.  Open the app on any device. All your files will be automatically loaded!

### CSV Format
Your CSV should look something like this:

```csv
Question,Answer,Category
Apple,苹果,English
Book,书,English
```

The app will try to auto-detect these columns.
