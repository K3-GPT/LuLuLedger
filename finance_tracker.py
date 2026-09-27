#!/usr/bin/env python3
"""
Personal Finance Tracker
A comprehensive application for tracking income, expenses, and financial goals
Author: Zishan A. Shaikh
"""

import tkinter as tk
from tkinter import ttk, messagebox
import csv
import os
from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

class FinanceTracker:
    def __init__(self, root):
        self.root = root
        self.root.title("Personal Finance Tracker")
        self.root.geometry("900x700")
        self.root.configure(bg='#2C3E50')
        
        # Data storage
        self.transactions = []
        self.filename = "transactions.csv"
        self.load_transactions()
        
        # Categories
        self.expense_categories = [
            "Food", "Transportation", "Entertainment", "Shopping", 
            "Bills", "Healthcare", "Education", "Other"
        ]
        self.income_categories = [
            "Salary", "Freelance", "Investment", "Gift", "Other"
        ]
        
        self.create_widgets()
    
    def create_widgets(self):
        """Create the main GUI layout"""
        # Title
        title_frame = tk.Frame(self.root, bg='#34495E', pady=15)
        title_frame.pack(fill='x')
        
        title_label = tk.Label(
            title_frame, 
            text="💰 Personal Finance Tracker", 
            font=('Arial', 24, 'bold'),
            bg='#34495E',
            fg='white'
        )
        title_label.pack()
        
        # Main container
        main_container = tk.Frame(self.root, bg='#2C3E50')
        main_container.pack(fill='both', expand=True, padx=20, pady=10)
        
        # Left panel - Input Section
        left_panel = tk.Frame(main_container, bg='#34495E', padx=20, pady=20)
        left_panel.pack(side='left', fill='both', expand=True, padx=(0, 10))
        
        self.create_input_section(left_panel)
        
        # Right panel - Display Section
        right_panel = tk.Frame(main_container, bg='#34495E', padx=20, pady=20)
        right_panel.pack(side='right', fill='both', expand=True)
        
        self.create_display_section(right_panel)
        
        # Bottom panel - Buttons
        button_frame = tk.Frame(self.root, bg='#2C3E50', pady=10)
        button_frame.pack(fill='x', padx=20)
        
        self.create_buttons(button_frame)
    
    def create_input_section(self, parent):
        """Create the transaction input section"""
        tk.Label(
            parent, 
            text="Add Transaction", 
            font=('Arial', 16, 'bold'),
            bg='#34495E',
            fg='white'
        ).pack(pady=(0, 20))
        
        # Transaction Type
        type_frame = tk.Frame(parent, bg='#34495E')
        type_frame.pack(fill='x', pady=5)
        
        tk.Label(
            type_frame, 
            text="Type:", 
            font=('Arial', 10),
            bg='#34495E',
            fg='white',
            width=12,
            anchor='w'
        ).pack(side='left')
        
        self.type_var = tk.StringVar(value="Expense")
        type_combo = ttk.Combobox(
            type_frame,
            textvariable=self.type_var,
            values=["Income", "Expense"],
            state='readonly',
            width=25
        )
        type_combo.pack(side='left', fill='x', expand=True)
        type_combo.bind('<<ComboboxSelected>>', self.update_categories)
        
        # Amount
        amount_frame = tk.Frame(parent, bg='#34495E')
        amount_frame.pack(fill='x', pady=5)
        
        tk.Label(
            amount_frame, 
            text="Amount ($):", 
            font=('Arial', 10),
            bg='#34495E',
            fg='white',
            width=12,
            anchor='w'
        ).pack(side='left')
        
        self.amount_var = tk.StringVar()
        tk.Entry(
            amount_frame,
            textvariable=self.amount_var,
            font=('Arial', 10),
            width=27
        ).pack(side='left', fill='x', expand=True)
        
        # Category
        category_frame = tk.Frame(parent, bg='#34495E')
        category_frame.pack(fill='x', pady=5)
        
        tk.Label(
            category_frame, 
            text="Category:", 
            font=('Arial', 10),
            bg='#34495E',
            fg='white',
            width=12,
            anchor='w'
        ).pack(side='left')
        
        self.category_var = tk.StringVar()
        self.category_combo = ttk.Combobox(
            category_frame,
            textvariable=self.category_var,
            values=self.expense_categories,
            state='readonly',
            width=25
        )
        self.category_combo.pack(side='left', fill='x', expand=True)
        self.category_combo.current(0)
        
        # Description
        desc_frame = tk.Frame(parent, bg='#34495E')
        desc_frame.pack(fill='x', pady=5)
        
        tk.Label(
            desc_frame, 
            text="Description:", 
            font=('Arial', 10),
            bg='#34495E',
            fg='white',
            width=12,
            anchor='w'
        ).pack(side='left')
        
        self.description_var = tk.StringVar()
        tk.Entry(
            desc_frame,
            textvariable=self.description_var,
            font=('Arial', 10),
            width=27
        ).pack(side='left', fill='x', expand=True)
        
        # Add Transaction Button
        tk.Button(
            parent,
            text="Add Transaction",
            command=self.add_transaction,
            bg='#27AE60',
            fg='white',
            font=('Arial', 12, 'bold'),
            cursor='hand2',
            pady=10
        ).pack(fill='x', pady=(20, 0))
    
    def create_display_section(self, parent):
        """Create the transaction display section"""
        tk.Label(
            parent, 
            text="Recent Transactions", 
            font=('Arial', 16, 'bold'),
            bg='#34495E',
            fg='white'
        ).pack(pady=(0, 10))
        
        # Create Treeview
        columns = ('Date', 'Type', 'Category', 'Amount', 'Description')
        self.tree = ttk.Treeview(parent, columns=columns, show='headings', height=15)
        
        # Define headings
        for col in columns:
            self.tree.heading(col, text=col)
            if col == 'Amount':
                self.tree.column(col, width=80, anchor='e')
            elif col == 'Date':
                self.tree.column(col, width=100)
            else:
                self.tree.column(col, width=100)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(parent, orient='vertical', command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # Update display
        self.update_display()
    
    def create_buttons(self, parent):
        """Create action buttons"""
        button_style = {
            'font': ('Arial', 11, 'bold'),
            'cursor': 'hand2',
            'pady': 8,
            'padx': 15
        }
        
        tk.Button(
            parent,
            text="📊 View Summary",
            command=self.show_summary,
            bg='#3498DB',
            fg='white',
            **button_style
        ).pack(side='left', padx=5)
        
        tk.Button(
            parent,
            text="📈 View Charts",
            command=self.show_charts,
            bg='#9B59B6',
            fg='white',
            **button_style
        ).pack(side='left', padx=5)
        
        tk.Button(
            parent,
            text="🗑️ Delete Selected",
            command=self.delete_transaction,
            bg='#E74C3C',
            fg='white',
            **button_style
        ).pack(side='left', padx=5)
        
        tk.Button(
            parent,
            text="💾 Export CSV",
            command=self.export_csv,
            bg='#16A085',
            fg='white',
            **button_style
        ).pack(side='left', padx=5)
    
    def update_categories(self, event=None):
        """Update category dropdown based on transaction type"""
        if self.type_var.get() == "Income":
            self.category_combo['values'] = self.income_categories
        else:
            self.category_combo['values'] = self.expense_categories
        self.category_combo.current(0)
    
    def add_transaction(self):
        """Add a new transaction"""
        try:
            amount = float(self.amount_var.get())
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except ValueError as e:
            messagebox.showerror("Error", "Please enter a valid positive amount")
            return
        
        transaction = {
            'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'type': self.type_var.get(),
            'category': self.category_var.get(),
            'amount': amount,
            'description': self.description_var.get()
        }
        
        self.transactions.append(transaction)
        self.save_transactions()
        self.update_display()
        
        # Clear inputs
        self.amount_var.set('')
        self.description_var.set('')
        
        messagebox.showinfo("Success", "Transaction added successfully!")
    
    def update_display(self):
        """Update the transaction display"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Add transactions (most recent first)
        for transaction in reversed(self.transactions[-50:]):  # Show last 50
            values = (
                transaction['date'],
                transaction['type'],
                transaction['category'],
                f"${transaction['amount']:.2f}",
                transaction['description']
            )
            
            # Color code by type
            tag = 'income' if transaction['type'] == 'Income' else 'expense'
            self.tree.insert('', 'end', values=values, tags=(tag,))
        
        # Configure tags
        self.tree.tag_configure('income', background='#D5F4E6')
        self.tree.tag_configure('expense', background='#FADBD8')
    
    def delete_transaction(self):
        """Delete selected transaction"""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a transaction to delete")
            return
        
        if messagebox.askyesno("Confirm", "Delete selected transaction?"):
            item = self.tree.item(selected[0])
            values = item['values']
            
            # Find and remove transaction
            for transaction in self.transactions:
                if (transaction['date'] == values[0] and 
                    transaction['type'] == values[1] and
                    f"${transaction['amount']:.2f}" == values[3]):
                    self.transactions.remove(transaction)
                    break
            
            self.save_transactions()
            self.update_display()
            messagebox.showinfo("Success", "Transaction deleted!")
    
    def show_summary(self):
        """Show financial summary"""
        total_income = sum(t['amount'] for t in self.transactions if t['type'] == 'Income')
        total_expenses = sum(t['amount'] for t in self.transactions if t['type'] == 'Expense')
        balance = total_income - total_expenses
        
        # Category breakdown
        expense_by_category = {}
        for t in self.transactions:
            if t['type'] == 'Expense':
                category = t['category']
                expense_by_category[category] = expense_by_category.get(category, 0) + t['amount']
        
        summary = f"""
        💰 Financial Summary
        {'='*40}
        
        Total Income:    ${total_income:,.2f}
        Total Expenses:  ${total_expenses:,.2f}
        Net Balance:     ${balance:,.2f}
        
        {'='*40}
        Expenses by Category:
        """
        
        for category, amount in sorted(expense_by_category.items(), key=lambda x: x[1], reverse=True):
            percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
            summary += f"\n  {category}: ${amount:,.2f} ({percentage:.1f}%)"
        
        messagebox.showinfo("Financial Summary", summary)
    
    def show_charts(self):
        """Display visualization charts"""
        if not self.transactions:
            messagebox.showinfo("Info", "No transactions to display")
            return
        
        # Create new window for charts
        chart_window = tk.Toplevel(self.root)
        chart_window.title("Financial Charts")
        chart_window.geometry("1000x600")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Pie chart - Expenses by category
        expense_by_category = {}
        for t in self.transactions:
            if t['type'] == 'Expense':
                category = t['category']
                expense_by_category[category] = expense_by_category.get(category, 0) + t['amount']
        
        if expense_by_category:
            ax1.pie(
                expense_by_category.values(),
                labels=expense_by_category.keys(),
                autopct='%1.1f%%',
                startangle=90
            )
            ax1.set_title('Expenses by Category', fontsize=14, fontweight='bold')
        
        # Bar chart - Income vs Expenses
        total_income = sum(t['amount'] for t in self.transactions if t['type'] == 'Income')
        total_expenses = sum(t['amount'] for t in self.transactions if t['type'] == 'Expense')
        
        categories = ['Income', 'Expenses']
        amounts = [total_income, total_expenses]
        colors = ['#27AE60', '#E74C3C']
        
        ax2.bar(categories, amounts, color=colors)
        ax2.set_title('Income vs Expenses', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Amount ($)')
        
        for i, v in enumerate(amounts):
            ax2.text(i, v, f'${v:,.2f}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        
        # Embed in tkinter window
        canvas = FigureCanvasTkAgg(fig, master=chart_window)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
    
    def save_transactions(self):
        """Save transactions to CSV file"""
        with open(self.filename, 'w', newline='') as file:
            if self.transactions:
                fieldnames = ['date', 'type', 'category', 'amount', 'description']
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.transactions)
    
    def load_transactions(self):
        """Load transactions from CSV file"""
        if os.path.exists(self.filename):
            with open(self.filename, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    row['amount'] = float(row['amount'])
                    self.transactions.append(row)
    
    def export_csv(self):
        """Export transactions to a new CSV file"""
        if not self.transactions:
            messagebox.showinfo("Info", "No transactions to export")
            return
        
        export_filename = f"finance_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        with open(export_filename, 'w', newline='') as file:
            fieldnames = ['date', 'type', 'category', 'amount', 'description']
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.transactions)
        
        messagebox.showinfo("Success", f"Transactions exported to {export_filename}")

def main():
    root = tk.Tk()
    app = FinanceTracker(root)
    root.mainloop()

if __name__ == "__main__":
    main()
