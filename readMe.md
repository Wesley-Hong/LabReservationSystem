## Project Structure

```
LabReservationSystem
├── all mco1 files/       # Files from MCO1
├── controllers/          # Route handler functions
├── models/               # Database models
├── public/               # Static assets (CSS and images)
├── view/                 # HTML
├── .gitignore            # Files and folders excluded from Git
├── index.js              # Application entry point
├── package-lock.json     # Auto-generated dependency lock file
├── package.json          # Project metadata and dependencies
└── seed.js               # Database seeding script
```

---

## How to Run the Project in Windows

1. Open your project folder in File Explorer
2. Click the address bar at the top and type cmd, then press Enter
3. Run the following commands in order:

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm install`   | install dependencies                 |
| `node seed.js`  | seed the database                    |
| `node index.js` | start the app                        |

4. Open your browser and go to http://localhost:3000
