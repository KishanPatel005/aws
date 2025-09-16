-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('management', 'company') NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create employee_balances table
CREATE TABLE IF NOT EXISTS employee_balances (
  employeeId INT PRIMARY KEY,
  advance_balance DECIMAL(18,4) DEFAULT 0.0000,
  salary_due_balance DECIMAL(18,4) DEFAULT 0.0000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  eventDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eventType ENUM('ADVANCE_GIVEN', 'SALARY_ACCRUAL', 'SALARY_PAYMENT', 'ADVANCE_RECOVERY') NOT NULL,
  amount DECIMAL(18,4) NOT NULL,
  accountFromId INT NULL,
  monthRef VARCHAR(7) NOT NULL, -- YYYY-MM format
  note TEXT NULL,
  createdBy INT NOT NULL,
  idempotencyKey VARCHAR(255) UNIQUE NULL,
  salary_due_delta DECIMAL(18,4) DEFAULT 0.0000,
  advance_delta DECIMAL(18,4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accountFromId) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_employee_date (employeeId, eventDate),
  INDEX idx_employee_month_type (employeeId, monthRef, eventType)
);

-- Insert default accounts
INSERT IGNORE INTO accounts (id, type, name) VALUES 
(1, 'management', 'Yogesh'),
(2, 'management', 'Dharmesh'),
(3, 'company', 'bavadiya LLP');
