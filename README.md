# Personal-Finance-Tracker
A Python-based personal finance tracker with GUI and data visualization for tracking income, expenses, and financial goals

Personal Finance Tracker 💰
A comprehensive Python-based desktop application for tracking personal income, expenses, and financial goals. Features an intuitive GUI, data visualization, and automated reporting to help users manage their finances effectively.
Features

Transaction Management: Add, view, and delete income and expense transactions
Category Organization: Pre-defined categories for both income and expenses with customizable options
Data Visualization: Interactive pie charts and bar graphs to visualize spending patterns
Financial Summary: Automatic calculation of total income, expenses, net balance, and category breakdowns
Data Persistence: Automatic saving and loading of transactions using CSV files
Export Functionality: Export transaction history to timestamped CSV files for backup or analysis
Color-Coded Interface: Visual distinction between income (green) and expenses (red) for quick recognition
User-Friendly GUI: Clean, modern interface built with Tkinter

Technologies Used

Language: Python 3.x
GUI Framework: Tkinter
Data Visualization: Matplotlib
Data Storage: CSV files
Core Libraries:

tkinter - GUI components
matplotlib - Chart generation
csv - Data persistence
datetime - Timestamp management



Installation
Prerequisites

Python 3.6 or higher
pip (Python package manager)

Setup

Clone this repository:

bashgit clone https://github.com/ZishanSha/Personal-Finance-Tracker.git
cd Personal-Finance-Tracker

Install required dependencies:

bashpip install matplotlib
Note: tkinter comes pre-installed with Python on most systems. If not available, install it:

Ubuntu/Debian: sudo apt-get install python3-tk
macOS: Included with Python installation
Windows: Included with Python installation

How to Run
Simply execute the main Python file:
bashpython finance_tracker.py
The application window will open, and you can start tracking your finances immediately!
Usage Guide
Adding Transactions

Select Transaction Type: Choose "Income" or "Expense" from the dropdown
Enter Amount: Input the transaction amount in dollars
Choose Category: Select an appropriate category:

Income: Salary, Freelance, Investment, Gift, Other
Expense: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, Education, Other


Add Description: Provide a brief description of the transaction (optional)
Click "Add Transaction": The transaction will be saved automatically

Viewing Summary
Click the "📊 View Summary" button to see:

Total income
Total expenses
Net balance (income - expenses)
Expense breakdown by category with percentages

Visualizing Data
Click the "📈 View Charts" button to display:

Pie Chart: Expenses distributed by category
Bar Graph: Income vs. Expenses comparison

Managing Transactions

View Recent Transactions: The right panel shows your last 50 transactions
Delete Transaction: Select a transaction and click "🗑️ Delete Selected"
Export Data: Click "💾 Export CSV" to create a timestamped backup file

Data Storage
All transactions are automatically saved to transactions.csv in the same directory as the application. This file is:

Created automatically on first run
Updated in real-time when you add or delete transactions
Loaded automatically when you restart the application

Project Structure
Personal-Finance-Tracker/
│
├── finance_tracker.py          # Main application file
├── transactions.csv            # Auto-generated transaction data
├── finance_export_*.csv        # Exported backup files (timestamped)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
Code Architecture
Main Components

FinanceTracker Class: Core application logic

GUI initialization and layout
Transaction management (add, delete, display)
Data persistence (save/load CSV)


Input Section: User interface for adding transactions

Type selector (Income/Expense)
Amount entry
Category dropdown
Description field


Display Section: Transaction history viewer

Treeview widget showing recent transactions
Color-coded rows for easy identification
Scrollable interface


Visualization Module: Chart generation

Matplotlib integration
Pie chart for expense categories
Bar chart for income vs expenses



Future Enhancements

 Budget setting and alerts for overspending
 Monthly/yearly financial reports
 Multi-currency support
 Recurring transaction automation
 Data encryption for privacy
 Dark mode theme option
 Database integration (SQLite)
 Search and filter functionality
 Goal tracking features

What I Learned

GUI Development: Creating intuitive desktop applications with Tkinter, including layout management and event handling
Data Visualization: Integrating Matplotlib with Tkinter to create interactive charts and graphs
File I/O Operations: Implementing CSV-based data persistence for reliable data storage and retrieval
Error Handling: Validating user input and providing meaningful error messages for better user experience
Object-Oriented Design: Structuring code using classes and methods for maintainability and scalability
Real-World Problem Solving: Developing a practical application that addresses everyday financial management needs

Contributing
This is a personal project for educational purposes. However, suggestions and feedback are welcome!
Known Issues

Charts must be closed before opening new ones
Large transaction histories (1000+) may slow down the display

Author
Zishan A. Shaikh

GitHub: @ZishanSha
LinkedIn: zishan-shaikh-1b3b27388
Email: ZishanSha@csu.fullerton.edu
Portfolio: ZishanSha.github.io

License
This project is open source and available for educational purposes.

Built with Python 🐍 | Designed for practical financial management 💼 | Created as part of my CS portfolio 🎓
Last Updated: October 2025
