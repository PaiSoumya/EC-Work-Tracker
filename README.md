# 📊 Worklog - Personal Work Tracker

A modern, feature-rich work tracking application with Monday.com integration. Track your projects, log work hours, and visualize your productivity with beautiful analytics.

**🔒 100% Private - Runs entirely on your local machine. Your data never leaves your computer.**

![Worklog Banner](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-success)

## 🌟 Features

### 📋 Task Management
- **Log Work Entries** - Track tasks with detailed descriptions and hours
- **Project Association** - Link tasks to specific projects
- **Status Tracking** - Mark tasks as In Progress, Completed, or Pending
- **Daily Hours Breakdown** - Split hours across multiple days
- **Smart Filtering** - Search and filter by project, status, or time period

### 📁 Project Management
- **Comprehensive Project Details** - Track account, code, manager, product, and more
- **Hours Tracking** - Monitor total, claimed, and pending hours
- **Status Management** - Active, Deactive, or Temporary projects
- **Smart Alerts** - Get notified about overdue projects, high usage, or approaching deadlines
- **Advanced Filtering** - Filter by year, status, manager, or account

### 📊 Analytics Dashboard
- **Visual Charts** - Weekly hours, project status distribution, and hours distribution
- **Flexible Time Periods** - View data by week, month, custom month, quarter, year, or all time
- **Project-Specific Analytics** - Filter analytics by individual projects
- **Trend Analysis** - Track your productivity over time

### 🔗 Monday.com Integration
- **Seamless Sync** - Import tasks from Monday.com boards
- **Automatic Updates** - Keep your work tracker in sync with Monday.com
- **Board Selection** - Choose which board to sync with
- **Item Management** - View and manage imported items

### ⚙️ Data Management
- **Export Data** - Download all your data as JSON for backup
- **Import Data** - Restore from previously exported files
- **Local Storage** - All data stored securely in your browser
- **Privacy First** - No data sent to external servers

## 🚀 Quick Start

### Step 1: Download
```bash
# Option 1: Download ZIP
Download from: https://github.com/PaiSoumya/EC-Work-Tracker/archive/refs/heads/main.zip

# Option 2: Clone with Git
git clone https://github.com/PaiSoumya/EC-Work-Tracker.git
cd EC-Work-Tracker
```

### Step 2: Run Locally

**🌐 Method 1: Direct Browser (Simplest)**
- Double-click `index.html`
- Opens in your default browser
- ⚠️ Some features may be limited due to browser security

**🐍 Method 2: Python Server (Recommended)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: `http://localhost:8000`

**📦 Method 3: Node.js Server**
```bash
npm install -g http-server
http-server -p 8000
```
Then open: `http://localhost:8000`

**🪟 Method 4: Windows Batch File**
- Double-click `START_SERVER.bat`
- Automatically opens in your browser

### Step 3: Start Tracking
1. Click the **❓ Help** button for detailed instructions
2. Create your first project
3. Log your work
4. View analytics

📖 **For detailed setup instructions, open `SETUP_GUIDE.html` in your browser**

## 🔒 Privacy & Security

### Why Run Locally?

✅ **Complete Privacy**
- Your data never leaves your computer
- No external servers involved
- No tracking or analytics

✅ **Full Control**
- You own your data
- No internet required (after download)
- Works offline

✅ **Secure**
- No data transmission
- No cloud storage
- Browser-level security only

### Data Storage

- **Location:** Browser's localStorage on your computer
- **Capacity:** ~5-10MB per domain
- **Persistence:** Data persists until you clear browser cache
- **Sharing:** Each user/browser has separate data
- **Backup:** Use Export feature to save JSON backups

### Monday.com Integration

- **API Token:** Stored only in your browser's localStorage
- **Security:** Token never sent to any server except Monday.com API
- **Privacy:** Only you have access to your token
- **Recommendation:** Use a read-only token if possible

## 📖 How to Use

### Getting Started

1. **Create Your First Project**
   - Go to the Projects tab
   - Click "+ Add Project"
   - Fill in project details
   - Save the project

2. **Log Your Work**
   - Go to the Tasks tab
   - Click "+ Log work"
   - Select a project
   - Enter work details and hours
   - Save the entry

3. **View Analytics**
   - Go to the Analytics tab
   - Select a time period
   - View charts and statistics

4. **Monday.com Integration** (Optional)
   - Go to Settings tab
   - Enter API Token: Monday.com → Profile → Developers → API
   - Enter Board ID from your board URL
   - Test connection and save
   - Import items from Monday.com tab

## 📁 Project Structure

```
EC-Work-Tracker/
├── index.html          # Main application
├── script.js           # Application logic
├── styles.css          # Styling
├── storage.js          # Local storage management
├── START_SERVER.bat    # Windows quick start
├── SETUP_GUIDE.html    # Detailed setup instructions
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## 🛠️ Technologies Used

- **HTML5** - Structure and content
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Application logic
- **LocalStorage API** - Data persistence
- **Monday.com API** - Integration with Monday.com
- **No Dependencies** - Pure vanilla JavaScript

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

**Minimum Requirements:**
- Modern browser with localStorage support
- JavaScript enabled
- ~10MB free storage space

## 💾 Backup Your Data

**Important:** Since data is stored locally, always backup regularly!

### How to Backup:
1. Go to Settings tab
2. Click "Export All Data"
3. Save the JSON file to a safe location
4. Store backups on:
   - External drive
   - Cloud storage (encrypted)
   - Multiple locations

### How to Restore:
1. Go to Settings tab
2. Click "Import Data"
3. Select your backup JSON file
4. Data will be restored

## 🤝 Sharing with Team

### Option 1: Share the Application
1. Upload the repository to GitHub (code only, no data)
2. Team members download and run locally
3. Each person has their own separate data

### Option 2: Share Data Only
1. Export your data as JSON
2. Share the JSON file with team members
3. They import it into their local instance
4. ⚠️ Be careful with sensitive information

### Option 3: GitHub Repository (Code Only)
- Share the GitHub repository link
- Team members clone and run locally
- No data is shared, only the application code

## 🆘 Troubleshooting

### App Won't Load
- Make sure you're running a local server (not just opening index.html)
- Check browser console for errors (F12)
- Try a different browser

### Data Not Saving
- Check if localStorage is enabled in your browser
- Make sure you're not in incognito/private mode
- Check available storage space

### Monday.com Integration Issues
- Verify API token is correct
- Check Board ID is accurate
- Test connection before saving
- Ensure you have permissions on the board

### Import/Export Not Working
- Use a local server (Python/Node.js method)
- Direct browser method has security limitations
- Check file permissions

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

**Please ensure:**
- No sensitive data in commits
- Code works offline
- Privacy is maintained
- Documentation is updated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**PaiSoumya**
- GitHub: [@PaiSoumya](https://github.com/PaiSoumya)

## 🙏 Acknowledgments

- Built with privacy and security in mind
- No external dependencies for maximum control
- Inspired by the need for private work tracking

## 📞 Support

Need help?

1. Open `SETUP_GUIDE.html` for detailed setup instructions
2. Check the built-in Help system (❓ Help button)
3. Read this README
4. Open an issue on GitHub

## 🗺️ Roadmap

Future enhancements:

- [ ] Dark mode support
- [ ] Encrypted data export
- [ ] Desktop app version (Electron)
- [ ] Mobile-responsive improvements
- [ ] Advanced reporting features
- [ ] Calendar integration
- [ ] Multiple data profiles
- [ ] Automatic backup reminders

## ⚠️ Important Notes

1. **Data is Local** - Clearing browser data will delete your work tracker data
2. **Backup Regularly** - Use the export feature to save your data
3. **No Cloud Sync** - Data doesn't sync between devices automatically
4. **Privacy First** - No telemetry, no tracking, no external calls (except Monday.com API if you use it)
5. **Offline Capable** - Works without internet after initial download

## 📊 Stats

- **Version:** 1.0.0
- **Last Updated:** June 2026
- **Status:** Active Development
- **Language:** JavaScript
- **Framework:** Vanilla JS (No dependencies!)
- **Privacy:** 100% Local
- **License:** MIT

---

**🔒 Your data, your computer, your privacy.**

Made with ❤️ by PaiSoumya

**Star ⭐ this repository if you find it helpful!**
