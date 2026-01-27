# Product Requirements Document (PRD): Privacy Policy Repository

## 1. Project Overview
The goal is to develop a web-based repository for managing and viewing various versions of privacy policy documents. The system allows for hierarchical organization of documents via folders and subfolders. It features a dual-access system (Admin vs. Guest) to ensure secure management while providing easy access for viewing.

## 2. User Roles & Authentication
The system does not use a database for user management. Instead, it relies on two hardcoded access codes (passwords) configured directly in the source code.

### 2.1. Access Codes
1.  **Admin Password**: Grants full control (Read + Write). Use cases: Creating folders, uploading files, editing remarks, deleting items, reordering.
2.  **Guest Password**: Grants read-only access. Use cases: Browsing folders, viewing remarks, opening files.

### 2.2. Login Mechanism
-   A simple entry page requesting an access code.
-   Validation against the hardcoded values in the server configuration.
-   Session persistence (e.g., cookies or local storage) to avoiding re-entering password on every refresh.

## 3. Functional Requirements

### 3.1. Directory & Folder Management
-   **Structure**: Support for infinite (or deep) nesting of folders.
-   **Root View**: Users initially see the top-level directories (Level 1).
-   **Navigation**: Click to open folders and navigate deeper.
-   **Management (Admin Only)**:
    -   Create new folders.
    -   Rename folders/files.
    -   Delete folders (recursively or empty only - *Implementation detail: Default to safety prompt*).
-   **Sorting**:
    -   Supports **drag-and-drop** reordering of folders.
    -   The custom order must be persisted.

### 3.2. File Management
-   **Upload (Admin Only)**:
    -   Upload files (primary format: .docx/.doc).
    -   **Remarks**: Option to add a text remark/note when uploading a file.
-   **Viewing**:
    -   Files and their associated remarks are **only visible at the lowest level** (i.e., when a folder contains files).
    -   **Preview**: Clicking a file link should open the file in a **new browser tab**.
        -   *Technical implication*: Since browsers don't natively render Word docs, this will likely require a PDF conversion on the fly or using a viewer service (e.g., Office Web Viewer or converting to PDF upon upload). **Requirement specifies "online new tab open"**.

### 3.3. User Interface (UI/UX)
-   **Language**: Entire interface must be in **English**.
-   **Aesthetics**: Clean, professional, and visually appealing (Premium feel, consistent with modern web design).
-   **Layout**:
    -   **Navigation Bar**: Breadcrumbs or back button to navigate up the hierarchy.
    -   **Content Area**: 
        -   Grid or List view for folders.
        -   List view for files showing: Filename, Remark, Upload Date (optional).
    -   **Drag & Drop**: Visual cues when reordering folders.

## 4. Technical Constraints & Stack Suggestions
-   **Authentication**: Passwords stored in environment variables or a server-side config file.
-   **Storage**: Local filesystem or simple cloud storage (e.g., AWS S3) depending on deployment. Given the "update password from code" requirement, a self-contained Next.js app with local file storage or simple JSON DB for metadata (folder order, remarks) is recommended.
-   **Frontend**: React (Next.js) for dynamic routing and UI state management.
-   **Styling**: CSS Modules or Vanilla CSS as per developer preference (Tailwind if requested).

## 5. Success Metrics
-   Admin can successfully organize policy versions.
-   Guests can easily find and read the correct policy document.
-   Remarks are clearly visible next to relevant files.
-   Drag-and-drop sorting works smoothly and persists.
