#!/bin/bash

# 🔧 MySQL Fix Script for WyaparPay
# This script helps fix common MySQL connection issues

echo "🔧 MySQL Troubleshooting and Fix Script"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if MySQL is running
check_mysql() {
    print_status "Checking MySQL status..."
    
    # Check if MySQL process is running
    if pgrep -x "mysqld" > /dev/null; then
        print_success "MySQL process is running"
        return 0
    else
        print_warning "MySQL process not found"
        return 1
    fi
}

# Try different connection methods
test_connection() {
    print_status "Testing MySQL connection..."
    
    # Method 1: Default socket
    if mysql -u root -e "SELECT 1;" &> /dev/null; then
        print_success "MySQL connection successful (socket)"
        return 0
    fi
    
    # Method 2: TCP connection
    if mysql -u root -h 127.0.0.1 -P 3306 -e "SELECT 1;" &> /dev/null; then
        print_success "MySQL connection successful (TCP)"
        return 0
    fi
    
    # Method 3: With password
    if mysql -u root -p -e "SELECT 1;" &> /dev/null; then
        print_success "MySQL connection successful (with password)"
        return 0
    fi
    
    print_error "All connection methods failed"
    return 1
}

# Fix MySQL authentication
fix_auth() {
    print_status "Attempting to fix MySQL authentication..."
    
    # Try to connect and update authentication
    mysql -u root -h 127.0.0.1 -P 3306 -e "
        ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
        FLUSH PRIVILEGES;
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Authentication fixed"
        return 0
    else
        print_warning "Could not fix authentication automatically"
        return 1
    fi
}

# Start MySQL with different methods
start_mysql() {
    print_status "Starting MySQL..."
    
    # Method 1: Homebrew services
    if brew services start mysql 2>/dev/null; then
        sleep 3
        if test_connection; then
            return 0
        fi
    fi
    
    # Method 2: Direct start
    print_status "Trying direct MySQL start..."
    sudo /opt/homebrew/bin/mysqld_safe --user=mysql &
    sleep 5
    
    if test_connection; then
        return 0
    fi
    
    print_error "Could not start MySQL"
    return 1
}

# Main execution
main() {
    print_status "Starting MySQL troubleshooting..."
    
    # Check if MySQL is already running
    if check_mysql; then
        if test_connection; then
            print_success "MySQL is working correctly!"
            exit 0
        else
            print_warning "MySQL is running but connection failed"
        fi
    fi
    
    # Try to start MySQL
    if start_mysql; then
        print_success "MySQL started successfully!"
        exit 0
    fi
    
    # Try to fix authentication
    if fix_auth; then
        if test_connection; then
            print_success "MySQL authentication fixed!"
            exit 0
        fi
    fi
    
    print_error "Could not fix MySQL automatically"
    echo ""
    echo "Manual solutions:"
    echo "1. Try: brew services restart mysql"
    echo "2. Try: sudo /opt/homebrew/bin/mysqld_safe --user=mysql &"
    echo "3. Try: mysql -u root -p (and enter password)"
    echo "4. Check MySQL logs: tail -f /opt/homebrew/var/mysql/*.err"
    echo "5. Use Docker: docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:8.0"
    echo ""
    echo "For now, you can continue with backend development without MySQL"
    echo "The backend will show connection errors but won't crash"
}

main "$@"
