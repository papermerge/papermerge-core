# Papermerge Search Query Syntax

## Overview

Papermerge uses a powerful token-based search syntax with semicolons (`;`) as delimiters between filters.
Each search consists of free text and/or structured filters.

## Basic Syntax

### Free Text Search

Search for documents containing specific words or phrases:

```
financial reports;
```

```
contract agreement;
```

```
invoice 2024;
```

### Quoted Free Text

Use quotes when your search text contains special characters (colons):

```
"ratio: 1.6";
```

```
"Q4: Financial Summary";
```

```
'meeting notes: review';
```

---

## Filter Syntax

All filters follow the pattern: `FilterName:Value` or `FilterName:Operator:Value(s)`

Semicolons (`;`) separate each filter or free text token.

---

## Tag Filters

**Syntax:** `tag:ValueList` or `tag:Operator:ValueList`

### Basic Tag Filter (implicit "all" operator)

```
tag:important;
```

```
tag:invoice;
```

```
tag:draft;
```

### Tag Filter with Explicit Operators

**Any** (OR logic - document must have at least one of these tags):

```
tag:any:urgent,important,critical;
```

```
tag:any:invoice,receipt,bill;
```

**All** (AND logic - document must have all of these tags):

```
tag:all:paid,archived;
```

```
tag:all:reviewed,approved,signed;
```

**Not** (exclusion - document must NOT have any of these tags):

```
tag:not:deleted,archived;
```

```
tag:not:draft,temporary;
```

### Tags with Spaces (Unquoted)

When using semicolon as delimiter, you can include spaces in tag names without quotes:

```
tag:blue sky,white cloud;
```

```
tag:all:high priority,needs review;
```

```
tag:any:annual report,quarterly report;
```

### Tags with Spaces (Quoted)

Alternatively, you can still use quotes:

```
tag:"blue sky","white cloud";
```

```
tag:all:"high priority","needs review";
```

---

## Category Filters

**Syntax:** `cat:ValueList` or `cat:Operator:ValueList`

### Basic Category Filter (implicit "any" operator)

```
cat:finance;
```

```
cat:legal;
```

```
cat:hr;
```

### Category Filter with Explicit Operators

**Any** (OR logic - document is in at least one category):

```
cat:any:finance,accounting,tax;
```

```
cat:any:contracts,agreements;
```

**Not** (exclusion - document is NOT in any of these categories):

```
cat:not:archived,deleted;
```

```
cat:not:spam,junk;
```

### Categories with Spaces

```
cat:human resources,legal documents;
```

```
cat:any:annual reports,quarterly filings;
```

```
cat:not:old archives,deprecated files;
```

---

## Custom Field Filters

**Syntax:** `cf:FieldName:Operator:Value`

Custom fields require four parts: `cf`, field name, comparison operator, and value.

### Numeric Comparisons

**Greater than:**

```
cf:total:>:1000;
```

```
cf:age:>:30;
```

**Greater than or equal:**

```
cf:amount:>=:500;
```

```
cf:pages:>=:10;
```

**Less than:**

```
cf:price:<:100;
```

```
cf:quantity:<:50;
```

**Less than or equal:**

```
cf:discount:<=:20;
```

```
cf:score:<=:75;
```

**Equal:**

```
cf:status:=:approved;
```

```
cf:year:=:2024;
```

**Not equal:**

```
cf:status:!=:rejected;
```

```
cf:priority:!=:low;
```

### Custom Fields with Spaces in Names

Use quotes around field names containing spaces:

```
cf:"Total Amount":>:5000;
```

```
cf:"Invoice Date":=:2024-01-15;
```

```
cf:"Project Name":=:"Website Redesign";
```

### Custom Fields with Spaces in Values

Use quotes around values containing spaces:

```
cf:status:=:"In Progress";
```

```
cf:assignee:=:"John Smith";
```

```
cf:"Department Name":=:"Human Resources";
```

---

## Simple Filters

These filters take a single value without operators.

### Title Filter

Search in document titles:

```
title:contract;
```

```
title:invoice;
```

```
title:"Annual Report 2024";
```

### Date Filters

```
created_at:2024;
```

```
created_at:2024-01;
```

```
created_at:2024-01-15;
```

```
updated_at:2023-12;
```

### User Filters

```
created_by:john@example.com;
```

```
owner:admin@company.com;
```

```
updated_by:mary@example.com;
```

---

## Complex Queries

Combine multiple filters and free text:

### Example 1: Free Text + Tags

```
financial reports; tag:important;
```

### Example 2: Multiple Filters

```
tag:urgent; cat:finance; created_at:2024;
```

### Example 3: All Filter Types

```
quarterly review; tag:any:q1,q2,q3,q4; cat:not:archived; cf:total:>:10000; created_by:finance@company.com;
```

### Example 4: Complex Tag Logic

```
contracts; tag:all:signed,reviewed; tag:not:expired; title:2024;
```

### Example 5: Custom Fields with Multiple Conditions

```
invoices; cf:status:=:paid; cf:amount:>=:1000; cf:amount:<=:5000; cat:finance;
```

### Example 6: Multi-word Values

```
project documents; tag:high priority,needs approval; cat:active projects; cf:"Project Manager":=:"Sarah Johnson";
```

### Example 7: Comprehensive Search

```
urgent documents; tag:any:critical,high priority; cat:not:archived,deleted; cf:deadline:<:2024-12-31; cf:status:!=:completed; created_at:2024; owner:team@company.com;
```

---

## Operator Reference

### Tag Operators

- `any` - Document has **at least one** of the specified tags (OR logic)
- `all` - Document has **all** of the specified tags (AND logic)
- `not` - Document has **none** of the specified tags (exclusion)
- _(implicit)_ - When no operator specified, defaults to `all`

### Category Operators

- `any` - Document is in **at least one** of the specified categories (OR logic)
- `not` - Document is in **none** of the specified categories (exclusion)
- _(implicit)_ - When no operator specified, defaults to `any`

### Custom Field Comparison Operators

- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal to
- `<=` - Less than or equal to
- `=` - Equal to
- `!=` - Not equal to

---

## Special Characters

### Semicolon (`;`)

- **Purpose:** Delimiter between tokens (free text or filters)
- **Usage:** Type semicolon, Tab, or Enter to complete a token
- **Example:** `reports; tag:important;`

### Colon (`:`)

- **Purpose:** Separator within filters
- **Usage:** Separates filter parts (name, operator, values)
- **Example:** `tag:any:urgent,important`
- **Note:** To search for text containing colons, use quotes: `"ratio: 1.6"`

### Comma (`,`)

- **Purpose:** Separator between multiple values
- **Usage:** List multiple tags, categories, or values
- **Example:** `tag:invoice,receipt,bill`

### Quotes (`"` or `'`)

- **Purpose:** Escape special characters or include spaces
- **Usage:** Wrap text containing spaces, colons, commas, or semicolons
- **Examples:**
  - `"blue sky"` - value with spaces
  - `"ratio: 1.6"` - free text with colon
  - `cf:"Total Amount":>:100` - field name with spaces

---

## Tips & Best Practices

### 1. Whitespace in Values

When using semicolon as the delimiter, you can omit quotes for multi-word values:

✅ **Good:** `tag:blue sky,white cloud;`
✅ **Also Good:** `tag:"blue sky","white cloud";`

### 2. Completing Tokens

Multiple ways to complete a token:

- Type `;` (semicolon)
- Press `Tab`
- Press `Enter`
- Click "Add Filter" button

### 3. Implicit Operators

If you omit the operator:

- Tags default to `all` (must have all specified tags)
- Categories default to `any` (in any of the specified categories)

```
tag:important,urgent;        → tag:all:important,urgent;
cat:finance,legal;           → cat:any:finance,legal;
```

### 4. Combining Filters

You can use multiple filters of the same type:

```
tag:all:important,reviewed; tag:not:archived;
```

This finds documents that have both "important" AND "reviewed" tags, but NOT "archived".

### 5. Empty Values

Filters must have values. These are **invalid**:

❌ `tag:;`
❌ `cat:all:;`
❌ `cf:total:>:;`

### 6. Case Sensitivity

Filter names are case-insensitive, but values may be case-sensitive depending on your configuration:

```
tag:Important;     → Same as tag:important; (if case-insensitive)
TAG:important;     → Same as tag:important;
```

---

## Common Use Cases

### Find Recent Important Documents

```
tag:important; created_at:2024;
```

### Find Unpaid Invoices

```
invoices; tag:unpaid; cat:finance;
```

### Find Large Contracts

```
contracts; cf:value:>:50000; tag:active;
```

### Find Documents Needing Review

```
tag:any:draft,pending,needs review; tag:not:approved; owner:me@company.com;
```

### Find Archived Financial Documents from Q4

```
cat:finance; tag:archived; created_at:2023-10;
```

### Find High-Priority Open Tasks

```
cf:status:=:open; cf:priority:=:high; tag:not:completed;
```

---

## Error Messages

### Common Syntax Errors

**Missing semicolon between filters:**

```
❌ tag:important cat:finance
✅ tag:important; cat:finance;
```

**Invalid operator:**

```
❌ tag:maybe:important;
✅ tag:any:important;  or  tag:all:important;  or  tag:not:important;
```

**Wrong number of parts in custom field:**

```
❌ cf:total:1000;
✅ cf:total:>:1000;  or  cf:total:=:1000;
```

**Empty value list:**

```
❌ tag:all:;
✅ tag:all:important;
```

**Invalid comparison operator:**

```
❌ cf:total:equals:100;
✅ cf:total:=:100;
```

---

## Quick Reference Card

| Filter Type         | Syntax              | Example                    |
| ------------------- | ------------------- | -------------------------- |
| Free Text           | `text;`             | `financial reports;`       |
| Tag (implicit)      | `tag:value;`        | `tag:important;`           |
| Tag (explicit)      | `tag:op:values;`    | `tag:any:urgent,critical;` |
| Category (implicit) | `cat:value;`        | `cat:finance;`             |
| Category (explicit) | `cat:op:values;`    | `cat:not:archived;`        |
| Custom Field        | `cf:name:op:value;` | `cf:total:>:1000;`         |
| Title               | `title:value;`      | `title:contract;`          |
| Created Date        | `created_at:date;`  | `created_at:2024-01;`      |
| Owner               | `owner:email;`      | `owner:john@example.com;`  |

---

## Grammar Definition (Technical)

For developers and advanced users, here's the formal grammar:

```bnf
SearchQuery        ::= TokenList
TokenList          ::= Token (";" Token)* ";"?
Token              ::= FreeTextToken | FilterToken
FreeTextToken      ::= UnquotedFreeText | QuotedText
FilterToken        ::= CustomFieldFilter | TagFilter
                   | CategoryFilter | TitleFilter | CreatedAtFilter
                   | CreatedByFilter | UpdatedAtFilter | UpdatedByFilter
                   | OwnerFilter

CustomFieldFilter  ::= "cf" ":" CustomFieldName ":" ComparisonOp ":" Value
TagFilter          ::= "tag" ":" TagOp ":" ValueList | "tag" ":" ValueList
CategoryFilter     ::= "cat" ":" CategoryOp ":" ValueList | "cat" ":" ValueList

CustomFieldName    ::= UnquotedIdentifier | QuotedText
TagOp              ::= "any" | "all" | "not"
CategoryOp         ::= "any" | "not"
ComparisonOp       ::= ">" | "=" | "<=" | "=" | "!="

ValueList          ::= Value ("," Value)*
Value              ::= UnquotedValue | QuotedText
UnquotedFreeText   ::= [^;:]+
UnquotedIdentifier ::= [^;:,]+
UnquotedValue      ::= [^;,]+
QuotedText         ::= '"' [^"]* '"' | "'" [^']* "'"
```
