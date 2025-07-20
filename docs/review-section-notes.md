
# 🔎 Review — Match Analysis

**Purpose:**  
Enable recruiters to assess how well a candidate matches a specific job by analyzing their resume or LinkedIn profile.

---

## 🧑‍💼 Candidate Panel

Recruiters can evaluate two types of candidates. These options should be presented as **toggleable tabs** at the top of the panel:

### 1. Existing Candidate
- Select from a searchable dropdown (combobox) populated with talent names from the database.
- As the user types, matching candidates appear dynamically.

### 2. New Candidate
- Choose **one** of the following input methods (these options must be mutually exclusive):
  - **LinkedIn profile URL**
  - **PDF resume upload**

> _Note: If a LinkedIn URL is provided, PDF upload should be disabled, and vice versa._

---

## ⚙️ Running the Match Analysis

- **For Existing Candidates:**
  - When the user clicks **Run Analysis**, an API call is made.
  - The response is displayed in the **Results Section**.
  - The user can then mark the candidate as a **favorite**, adding them to the “Starred” or “Shortlisted” list.

- **For New Candidates:**
  - After inputting a LinkedIn URL or uploading a resume, the user clicks **Run Analysis**.
  - An API call is triggered and the results are displayed in the **Results Section**.
  - The system then:
    - Prompts the user to **save** the candidate to the database.
    - Once saved, the **favorite** option becomes available.

---

## 📊 Results Section

Once analysis is completed for any candidate type, the system displays the match results here.

> _Note: Specific result details to be defined. May include skill matching, role alignment score, and highlighted keywords._

---

## ⭐ Favorite Candidates

- Candidates marked as **favorites** will be added to a “Starred” or “Shortlisted” list for the current job.
- Only **saved candidates** (i.e. existing ones or newly saved after analysis) can be marked as favorites.
- For new candidates, the option to favorite appears **only after saving** them to the system.
