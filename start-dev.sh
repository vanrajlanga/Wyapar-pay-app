#!/bin/bash

# 🚀 WyaparPay Development Startup Script
# This script starts the backend and frontend with comprehensive logging

echo "🚀 Starting WyaparPay Development Environment..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    else
        NODE_VERSION=$(node --version)
        print_debug "Node.js version: $NODE_VERSION"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    else
        NPM_VERSION=$(npm --version)
        print_debug "npm version: $NPM_VERSION"
    fi
    
    # Check MySQL
    if ! mysql -u root -e "SELECT 1;" &> /dev/null; then
        print_warning "MySQL connection failed. Trying to start MySQL..."
        brew services start mysql
        sleep 5
        
        # Try again
        if ! mysql -u root -e "SELECT 1;" &> /dev/null; then
            print_warning "MySQL is not running. Continuing without MySQL for now..."
            print_debug "Run './fix-mysql.sh' to troubleshoot MySQL issues"
            print_debug "Backend will show connection errors but won't crash"
        else
            print_debug "MySQL connection successful"
        fi
    else
        print_debug "MySQL connection successful"
    fi
    
    # Check database (only if MySQL is working)
    if mysql -u root -e "SELECT 1;" &> /dev/null; then
        if mysql -u root -e "USE wyapar_pay; SHOW TABLES;" &> /dev/null; then
            TABLE_COUNT=$(mysql -u root -e "USE wyapar_pay; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'wyapar_pay';" | tail -n 1)
            print_debug "Database 'wyapar_pay' exists with $TABLE_COUNT tables"
        else
            print_warning "Database 'wyapar_pay' not found or empty"
            print_debug "Please run: mysql -u root -p wyapar_pay < docs/database/COMPLETE_DATABASE_SCHEMA.sql"
        fi
    else
        print_warning "Cannot check database - MySQL not accessible"
    fi
    
    print_success "Prerequisites checked!"
}

# Function to start backend with verbose logging
start_backend() {
    print_status "Starting Backend with verbose logging..."
    cd backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_warning "Please update .env file with your database credentials"
    else
        print_debug ".env file found"
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install --legacy-peer-deps 2>&1 | while IFS= read -r line; do
            print_debug "npm: $line"
        done
    else
        print_debug "Backend node_modules exists"
    fi
    
    # Check if NestJS CLI is available
    if ! command -v nest &> /dev/null; then
        print_status "Installing NestJS CLI globally..."
        npm install -g @nestjs/cli 2>&1 | while IFS= read -r line; do
            print_debug "nest-cli: $line"
        done
    else
        print_debug "NestJS CLI found"
    fi
    
    print_status "Starting backend server on port 3000 with verbose logging..."
    
    # Set environment variables for verbose logging
    export NODE_ENV=development
    export LOG_LEVEL=debug
    
    # Start with verbose output
    npm run start:dev 2>&1 | while IFS= read -r line; do
        echo -e "${CYAN}[BACKEND]${NC} $line"
    done &
    
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    print_success "Backend started! PID: $BACKEND_PID"
}

# Function to start frontend with verbose logging
start_frontend() {
    print_status "Starting Frontend with verbose logging..."
    cd frontend
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install --legacy-peer-deps --force 2>&1 | while IFS= read -r line; do
            print_debug "npm: $line"
        done
    else
        print_debug "Frontend node_modules exists"
    fi
    
    # Check if React Native CLI is available
    if ! command -v react-native &> /dev/null; then
        print_status "Installing React Native CLI globally..."
        npm install -g @react-native-community/cli 2>&1 | while IFS= read -r line; do
            print_debug "react-native-cli: $line"
        done
    else
        print_debug "React Native CLI found"
    fi
    
    print_status "Starting Metro bundler with verbose logging..."
    
    # Start Metro with verbose output
    npm start 2>&1 | while IFS= read -r line; do
        echo -e "${YELLOW}[FRONTEND]${NC} $line"
    done &
    
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    print_success "Frontend started! PID: $FRONTEND_PID"
}

# Function to show detailed status
show_status() {
    echo ""
    echo "🎯 Development Environment Status:"
    echo "=================================="
    echo "Backend API: http://localhost:3000"
    echo "Frontend Metro: http://localhost:8081"
    echo "Database: localhost:3306 (wyapar_pay)"
    echo "Redis: disabled (using in-memory alternatives)"
    echo ""
    echo "📊 Process Information:"
    if [ -f "backend.pid" ]; then
        echo "  Backend PID: $(cat backend.pid)"
    fi
    if [ -f "frontend.pid" ]; then
        echo "  Frontend PID: $(cat frontend.pid)"
    fi
    echo ""
    echo "📱 To run on device/simulator:"
    echo "  Android: cd frontend && npm run android"
    echo "  iOS: cd frontend && npm run ios"
    echo ""
    echo "🔍 To check logs:"
    echo "  Backend: tail -f backend/logs/app.log (if available)"
    echo "  Frontend: Check Metro output above"
    echo ""
    echo "🛑 To stop services:"
    echo "  ./stop-dev.sh"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up..."
    if [ -f "backend.pid" ]; then
        print_debug "Stopping backend (PID: $(cat backend.pid))"
        kill $(cat backend.pid) 2>/dev/null
        rm backend.pid
    fi
    if [ -f "frontend.pid" ]; then
        print_debug "Stopping frontend (PID: $(cat frontend.pid))"
        kill $(cat frontend.pid) 2>/dev/null
        rm frontend.pid
    fi
    print_success "Cleanup complete!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the WyaparPay root directory"
    exit 1
fi

# Main execution
case "${1:-all}" in
    "backend")
        check_prerequisites
        start_backend
        show_status
        print_status "Backend only mode. Press Ctrl+C to stop."
        wait
        ;;
    "frontend")
        check_prerequisites
        start_frontend
        show_status
        print_status "Frontend only mode. Press Ctrl+C to stop."
        wait
        ;;
    "all"|"")
        check_prerequisites
        start_backend
        sleep 5
        start_frontend
        show_status
        print_status "Full development mode. Press Ctrl+C to stop all services."
        wait
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [backend|frontend|all|help]"
        echo ""
        echo "Options:"
        echo "  backend   - Start only the backend server"
        echo "  frontend  - Start only the frontend Metro bundler"
        echo "  all       - Start both backend and frontend (default)"
        echo "  help      - Show this help message"
        echo ""
        echo "Features:"
        echo "  - Automatic prerequisite checking"
        echo "  - Comprehensive logging and error tracking"
        echo "  - Health check endpoint at /api/v1/health"
        echo "  - Redis disabled by default for cost savings"
        exit 0
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
