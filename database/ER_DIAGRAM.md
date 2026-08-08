# MilletsNow Database ER Diagram

PostgreSQL entity relationship diagram for the Phase 2 database foundation.

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : creates
    USERS ||--o{ PRODUCT_BATCHES : creates
    USERS ||--o{ QR_CODES : creates
    USERS ||--o{ FEEDBACK : assigns
    USERS ||--o{ QUESTIONS : answers
    USERS ||--o{ COMPLAINTS : resolves
    USERS ||--o{ SUGGESTIONS : implements
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ACTIVITY_LOGS : performs
    USERS ||--o{ SETTINGS : owns

    CATEGORIES ||--o{ CATEGORIES : contains
    CATEGORIES ||--o{ PRODUCTS : classifies
    PRODUCTS ||--o{ PRODUCT_BATCHES : has
    PRODUCTS ||--o{ QR_CODES : identifies
    PRODUCT_BATCHES ||--o{ QR_CODES : labels
    QR_CODES ||--o{ QR_SCAN_LOGS : records
    CUSTOMERS ||--o{ QR_SCAN_LOGS : makes

    CUSTOMERS ||--o{ FEEDBACK : submits
    PRODUCTS ||--o{ FEEDBACK : receives
    PRODUCT_BATCHES ||--o{ FEEDBACK : traces
    QR_CODES ||--o{ FEEDBACK : attributes
    FEEDBACK ||--o| QUESTIONS : specializes_as
    FEEDBACK ||--o| COMPLIMENTS : specializes_as
    FEEDBACK ||--o| COMPLAINTS : specializes_as
    FEEDBACK ||--o| SUGGESTIONS : specializes_as

    USERS {
        uuid id PK
        text email UK
        text full_name
        user_role role
        user_status status
        timestamptz created_at
        timestamptz updated_at
    }
    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        text name
        text slug UK
        timestamptz created_at
        timestamptz updated_at
    }
    PRODUCTS {
        uuid id PK
        uuid category_id FK
        uuid created_by FK
        text name
        text slug UK
        text sku UK
        timestamptz created_at
        timestamptz updated_at
    }
    PRODUCT_BATCHES {
        uuid id PK
        uuid product_id FK
        text batch_number
        date manufacturing_date
        date expiry_date
        int quantity
        timestamptz created_at
        timestamptz updated_at
    }
    QR_CODES {
        uuid id PK
        uuid product_id FK
        uuid batch_id FK
        text code UK
        qr_code_status status
        timestamptz created_at
        timestamptz updated_at
    }
    QR_SCAN_LOGS {
        uuid id PK
        uuid qr_code_id FK
        uuid customer_id FK
        timestamptz scanned_at
        inet ip_address
        timestamptz created_at
        timestamptz updated_at
    }
    CUSTOMERS {
        uuid id PK
        text external_reference
        text full_name
        text email
        text phone
        timestamptz created_at
        timestamptz updated_at
    }
    FEEDBACK {
        uuid id PK
        uuid customer_id FK
        uuid product_id FK
        uuid batch_id FK
        uuid qr_code_id FK
        uuid assigned_to FK
        smallint rating
        feedback_status status
        timestamptz submitted_at
        timestamptz created_at
        timestamptz updated_at
    }
    QUESTIONS {
        uuid id PK
        uuid feedback_id FK,UK
        text question
        text answer
        timestamptz created_at
        timestamptz updated_at
    }
    COMPLIMENTS {
        uuid id PK
        uuid feedback_id FK,UK
        text message
        timestamptz created_at
        timestamptz updated_at
    }
    COMPLAINTS {
        uuid id PK
        uuid feedback_id FK,UK
        smallint severity
        uuid resolved_by FK
        timestamptz resolved_at
        timestamptz created_at
        timestamptz updated_at
    }
    SUGGESTIONS {
        uuid id PK
        uuid feedback_id FK,UK
        text suggestion
        boolean implemented
        timestamptz created_at
        timestamptz updated_at
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        notification_type type
        text title
        text message
        timestamptz read_at
        timestamptz created_at
        timestamptz updated_at
    }
    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }
    SETTINGS {
        uuid id PK
        uuid user_id FK
        text setting_key
        jsonb setting_value
        timestamptz created_at
        timestamptz updated_at
    }
```

`questions`, `compliments`, `complaints`, and `suggestions` are one-to-zero-or-one feedback subtypes through their unique `feedback_id` foreign keys. All tables use UUID primary keys and automatic `updated_at` triggers.
