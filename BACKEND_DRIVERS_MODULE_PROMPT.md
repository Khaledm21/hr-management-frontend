# 🚛 برومبت إنشاء وربط موديول السواقين وقبضهم الأسبوعي في الباك إند
# Backend Prompt: Drivers & Weekly Payout Module

> **طريقة الاستخدام**:  
> انسخ هذا البرومبت بالكامل وأرسله لمطور الباك إند أو لأي نموذج ذكاء اصطناعي (مثل Antigravity / Claude / ChatGPT) في مشروع الباك إند الخاص بك، وسيقوم بإنشاء الجداول والراوتات ومنطق التجميع المالي فوراً!

---

```markdown
You are a Senior Principal Backend Engineer specializing in Node.js/Express/TypeScript (or NestJS/FastAPI/Laravel).

I have a production-ready Frontend for an Enterprise HR Management System running at `http://localhost:5173`.
We recently built a modern **Driver Payout & Fleet Module** to replace a manual weekly Excel spreadsheet (`الملخص الأسبوعي - متابعة قبض السواقين`).

The frontend expects standard REST API endpoints at base URL: `http://localhost:5000/api`.

---

## 🎯 Task Objective:
Build and expose the complete Backend Database Schemas, Services, Controllers, and REST Endpoints for:
1. **Drivers Management (`/api/drivers`)**: Full CRUD for drivers fleet.
2. **Weekly Cycles & Summaries (`/api/driver-payouts/summaries`)**: Weekly tracking periods with financial aggregations.
3. **Payout Transactions (`/api/driver-payouts/transactions`)**: Trip payouts, categories (Management vs Production), and receipts.

---

## 🗄️ 1. Database Schema & Tables

### A. Table: `drivers`
```sql
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,                    -- UUID or 'drv-...'
    code VARCHAR(30) NOT NULL UNIQUE,              -- e.g. 'DRV-01', 'DRV-02'
    name VARCHAR(150) NOT NULL,                    -- اسم السائق e.g. 'احمد فريد'
    phone VARCHAR(30),
    national_id VARCHAR(20),
    vehicle_number VARCHAR(50),                    -- رقم اللوحة e.g. 'أ ب ج 1122'
    vehicle_type VARCHAR(100) DEFAULT 'جامبو 7000',-- نوع المركبة e.g. 'جامبو 7000', 'دبابة', 'نقل ثقيل'
    default_category VARCHAR(30) DEFAULT 'production' CHECK (default_category IN ('management', 'production')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joined_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_drivers_code ON drivers(code);
CREATE INDEX idx_drivers_status ON drivers(status);
```

### B. Table: `weekly_payout_summaries`
```sql
CREATE TABLE IF NOT EXISTS weekly_payout_summaries (
    week_period VARCHAR(30) PRIMARY KEY,           -- e.g. '2026-10-12' (ISO week start date)
    week_label VARCHAR(150) NOT NULL,              -- e.g. 'Monday, October 12, 2026'
    date DATE NOT NULL,
    total_drivers INT DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_operations INT DEFAULT 0,
    average_payout DECIMAL(12, 2) DEFAULT 0.00,
    management_total DECIMAL(15, 2) DEFAULT 0.00,  -- إجمالي الإدارة
    production_total DECIMAL(15, 2) DEFAULT 0.00,  -- إجمالي الإنتاج
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'locked')),
    locked_at TIMESTAMP,
    locked_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### C. Table: `driver_payout_transactions`
```sql
CREATE TABLE IF NOT EXISTS driver_payout_transactions (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    week_period VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('management', 'production')),
    description TEXT,                              -- بيان المشوار / الحمولة
    vehicle_plate VARCHAR(50),
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'cheque')),
    receipt_number VARCHAR(50),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payout_driver FOREIGN KEY (driver_id)
        REFERENCES drivers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payout_week FOREIGN KEY (week_period)
        REFERENCES weekly_payout_summaries(week_period) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX idx_payout_driver_id ON driver_payout_transactions(driver_id);
CREATE INDEX idx_payout_week_period ON driver_payout_transactions(week_period);
CREATE INDEX idx_payout_category ON driver_payout_transactions(category);
```

---

## 🔌 2. REST API Specification & Endpoints

### 🚛 A. Drivers Endpoints (`/api/drivers`)

1. **`GET /api/drivers`**
   - Returns all drivers.
   - Query params: `?status=active|inactive&search=...`
   - Response: `Driver[]` or `{ success: true, data: Driver[] }`
   ```json
   [
     {
       "id": "drv-1",
       "code": "DRV-01",
       "name": "احمد فريد",
       "phone": "01012345671",
       "nationalId": "28801011234567",
       "vehicleNumber": "أ ب ج 1122",
       "vehicleType": "سيارة إدارة",
       "defaultCategory": "management",
       "status": "active",
       "joinedDate": "2023-01-15",
       "notes": "سائق مأموريات الإدارة"
     }
   ]
   ```

2. **`GET /api/drivers/:id`**
   - Returns single driver details.

3. **`POST /api/drivers`**
   - Request Body:
   ```json
   {
     "name": "محمود عبد الرازق",
     "phone": "01099887766",
     "nationalId": "29105051234567",
     "vehicleNumber": "ب ط ج 5544",
     "vehicleType": "جامبو 7000",
     "defaultCategory": "production",
     "notes": "خط تشغيل جديد"
   }
   ```
   - Automatically generates next `code` (e.g. `DRV-15`) and `id`.
   - Returns: Created driver object.

4. **`PUT /api/drivers/:id`**
   - Update driver fields.

5. **`DELETE /api/drivers/:id`**
   - Delete driver and cascade/restrict relations.

---

### 📅 B. Weekly Summaries Endpoints (`/api/driver-payouts/summaries`)

1. **`GET /api/driver-payouts/summaries`**
   - Returns list of weekly cycles.
   - Response:
   ```json
   [
     {
       "weekPeriod": "2026-10-12",
       "weekLabel": "Monday, October 12, 2026",
       "date": "2026-10-12",
       "totalDrivers": 14,
       "totalAmount": 108595,
       "totalOperations": 32,
       "averagePayout": 7757,
       "managementTotal": 13780,
       "productionTotal": 94815,
       "status": "open"
     }
   ]
   ```

2. **`GET /api/driver-payouts/summaries/:weekPeriod`**
   - Returns summary for specific week.
   - If not computed yet, triggers dynamic calculation from transactions.

3. **`POST /api/driver-payouts/summaries`**
   - Initialize a new weekly cycle.
   - Body: `{ "weekPeriod": "2026-10-19", "weekLabel": "Monday, October 19, 2026" }`

4. **`PUT /api/driver-payouts/summaries/:weekPeriod/status`**
   - Lock/Unlock week: `{ "status": "locked", "lockedBy": "مدير الحسابات" }`

---

### 💳 C. Payout Transactions Endpoints (`/api/driver-payouts/transactions`)

1. **`GET /api/driver-payouts/transactions`**
   - Query filters:
     - `?weekPeriod=2026-10-12`
     - `?driverId=drv-1`
     - `?category=management|production`
     - `?search=...`
   - Response:
   ```json
   [
     {
       "id": "tx-1",
       "driverId": "drv-1",
       "driverName": "احمد فريد",
       "weekPeriod": "2026-10-12",
       "date": "2026-10-12",
       "amount": 2700,
       "category": "management",
       "description": "مأموريات إدارة عامة",
       "vehiclePlate": "أ ب ج 1122",
       "status": "paid",
       "paymentMethod": "cash",
       "receiptNumber": "REC-2610-001",
       "orderIndex": 0,
       "createdAt": "2026-10-12T09:00:00Z"
     }
   ]
   ```

2. **`POST /api/driver-payouts/transactions`**
   - Request Body:
   ```json
   {
     "driverId": "drv-3",
     "driverName": "علاء بازيد",
     "weekPeriod": "2026-10-12",
     "date": "2026-10-12",
     "amount": 2400,
     "category": "production",
     "description": "نقل خامات خط الإنتاج 1",
     "vehiclePlate": "س ص ع 5566",
     "paymentMethod": "cash",
     "status": "paid"
   }
   ```
   - Logic on Insert:
     * Generates receipt number: `REC-YYMM-XXX`.
     * Calculates `orderIndex`: next index for this driver in this week.
     * **Auto-recalculates `weekly_payout_summaries`** for `weekPeriod`:
       - `managementTotal` = SUM(amount WHERE category = 'management' AND status != 'cancelled')
       - `productionTotal` = SUM(amount WHERE category = 'production' AND status != 'cancelled')
       - `totalAmount` = managementTotal + productionTotal
       - `totalDrivers` = COUNT(DISTINCT driver_id)
       - `totalOperations` = COUNT(id)
       - `averagePayout` = totalAmount / totalDrivers

3. **`PUT /api/driver-payouts/transactions/:id`**
   - Update transaction and trigger summary recalculation.

4. **`DELETE /api/driver-payouts/transactions/:id`**
   - Delete transaction and trigger summary recalculation.

---

## ⚡ 3. Initial Seed Data (Optional for testing)
If seeding initial data matching the user's Excel sheet:
- Drivers:
  `['احمد فريد', 'أبو عمر', 'علاء بازيد', 'احمد جمعه', 'احمد شوقي', 'عمرو إبراهيم', 'خيري محمد', 'رمزي إبراهيم', 'السعيد عوض', 'علي محمد', 'السيد محمد', 'ناصر ماهر', 'السيد عبدالرازق', 'بهاء سمير']`
- Week `2026-10-12`:
  * Grand Total: 108,595 EGP
  * Administration Total: 13,780 EGP
  * Production Total: 94,815 EGP
  * Total Operations: 32

---

## 🛡️ 4. CORS & Port:
- Enable CORS for `http://localhost:5173`.
- Backend runs on `http://localhost:5000` with API prefix `/api`.
```
