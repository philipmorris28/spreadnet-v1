#!/usr/bin/env python3
"""
SpreadNet Setup Script
Run this to quickly install all dependencies and start SpreadNet.
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a shell command and return result."""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    print("🚀 SpreadNet Setup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8+ required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    success, output = run_command("pip install -r requirements.txt")
    
    if success:
        print("✅ Dependencies installed successfully")
    else:
        print(f"❌ Failed to install dependencies: {output}")
        sys.exit(1)
    
    # Check if ready to run
    print("\n🎯 Setup complete!")
    print("\nTo start SpreadNet:")
    print("  python app.py")
    print("\nThen open: http://localhost:8080")
    print("\n🔥 Happy arbitrage hunting!")

if __name__ == "__main__":
    main()
