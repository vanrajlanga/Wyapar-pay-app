#!/bin/bash

# 🛑 WyaparPay Development Stop Script
# This script stops all development services

echo "🛑 Stopping WyaparPay Development Services..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid
            sleep 2
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "Force stopping $service_name..."
                kill -9 $pid
            fi
            
            print_success "$service_name stopped!"
        else
            print_warning "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Stop backend service
stop_service "Backend" "backend.pid"

# Stop frontend service
stop_service "Frontend" "frontend.pid"

# Kill any remaining Node.js processes related to our project
print_status "Checking for remaining Node.js processes..."

# Kill backend processes
pkill -f "nest start" 2>/dev/null || true
pkill -f "wyapar-pay-backend" 2>/dev/null || true

# Kill frontend processes
pkill -f "react-native start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

print_success "All development services stopped!"

# Show final status
echo ""
echo "🎯 Services Status:"
echo "==================="
echo "Backend API: Stopped"
echo "Frontend Metro: Stopped"
echo "Database: Still running (use 'brew services stop mysql' to stop)"
echo "Redis: Still running (use 'brew services stop redis' to stop)"
echo ""
echo "✅ Development environment stopped successfully!"
