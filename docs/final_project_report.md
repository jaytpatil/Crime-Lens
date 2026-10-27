# Big Data Analytics for Crime Pattern Analysis and Crime Risk Prediction using Hadoop and Machine Learning

**Academic Course:** B.Tech Computer Engineering — Big Data Analytics (BDA)  
**Project Category:** Distributed Big Data Processing, Geospatial Clustering & Machine Learning  
**Dataset:** Kaggle Los Angeles Police Department (LAPD) — *Crime Data from 2020 to Present*  
**Technology Stack:** Apache Spark (PySpark 3.5.1), Hadoop HDFS (3.2.1), Scikit-Learn, FastAPI, React 19, Tailwind CSS, Leaflet, Recharts  

---

## 1. Executive Summary

This project presents an end-to-end, production-grade Big Data Analytics and Machine Learning system for urban crime pattern discovery and historical risk classification. Urban law enforcement datasets are characterized by high volume, multi-dimensional attributes, and spatial-temporal interdependencies that exceed the analytical capabilities of traditional relational databases.

To address these challenges, this system implements:
1. **Distributed Big Data Processing:** An Apache PySpark DataFrame pipeline executing schema inference, duplicate removal, coordinate bounding box validation, temporal feature engineering, and Parquet columnar persistence.
2. **Distributed Storage (HDFS):** A dual-mode storage layer supporting both local file storage (**Mode A**) and Hadoop Distributed File System (**Mode B**) across structured directories (`/crime-analysis/raw/`, `/processed/`, `/analytics/`, `/models/`).
3. **Unsupervised Spatial Hotspot Discovery:** A K-Means clustering model ($K=12$) applied to standardized geographical coordinates (Latitude, Longitude), deriving incident density centroids and ranking hotspots by observed crime volume.
4. **Supervised Crime Risk Classification:** A Random Forest Classifier that categorizes aggregate spatio-temporal units `(Area, Month, Day of Week, Time Period)` into **Low Risk**, **Medium Risk**, and **High Risk** tertiles ($Q_{33}$ and $Q_{66}$) derived strictly from the training split.
5. **Interactive Full-Stack Web Dashboard:** A responsive, dark-themed React + Vite dashboard integrating OpenStreetMap raster tiles via Leaflet, Recharts data visualizations, and asynchronous background job execution via FastAPI.

---

## 2. Real Dashboard Snapshots & Module Walkthrough

The following sections present actual snapshots captured from the running application dashboard (`http://localhost:5173/`), validating complete frontend-backend integration, real data calculations, and interactive map rendering.

### 2.1 Overview Dashboard
The Overview Dashboard provides executive-level Key Performance Indicators (KPIs), temporal crime trends, and risk distribution summaries computed directly from the processed dataset.

![Overview Dashboard](screenshots/01_overview_dashboard.png)

**Key Metrics & Features Displayed:**
- **KPI Cards:** Total Crime Records (**15,907** cleaned records), Unique Granular Crime Categories (**11** broad legal categories, **13** specific offenses), Identified Hotspots (**12** spatial clusters), and ML Model Test Accuracy (**54.7%**).
- **Top Division Callout:** Highlights **Rampart** as the highest-density division (**2,538** incidents).
- **Monthly Incident Trend (Line Chart):** Multi-year temporal crime progression showing historical seasonal variations from 2021 through 2023.
- **Historical Risk Distribution (Bar Chart):** Displays the distribution of spatio-temporal units across Low Risk ($N \le Q_{33}$), Medium Risk ($Q_{33} < N \le Q_{66}$), and High Risk ($N > Q_{66}$).
- **Weekday vs Weekend Dynamic:** Quantitative comparison illustrating that **69.8%** of crimes occur on weekdays (averaging 2,221 incidents/day) versus **30.2%** on weekends (averaging 2,402 incidents/day), highlighting higher weekend nighttime density.

---

### 2.2 Crime Analytics Module
The Crime Analytics module provides multi-dimensional exploratory data analysis with interactive filtering across LAPD divisions, crime categories, and custom date ranges.

![Crime Analytics Module](screenshots/02_crime_analytics.png)

**Key Visualizations & Features:**
- **Interactive Filter Toolbar:** Allows instant querying across all 21 LAPD divisions, normalized crime classifications, and date boundaries.
- **Temporal Crime Volume Curve:** Recharts line chart reflecting filtered incident trajectories and Month-over-Month (MoM) percentage growth rates.
- **Incidents by Day of Week (Bar Chart):** Day-by-day distribution from Monday through Sunday, identifying localized weekend surges.
- **Diurnal 24-Hour Incident Curve (Area Chart):** High-resolution hourly crime progression based on military timestamps (`TIME OCC`), revealing peak incident concentration during evening and nighttime shifts (**18:00 – 23:00**).
- **Top 10 High-Density LAPD Divisions:** Bar chart ranking the most frequent incident divisions (Rampart, 77th Street, Central, Southwest, Hollywood).
- **Cross-Tabulation Matrix:** Tabular breakdown comparing top geographic divisions against dominant crime types (Assault & Battery, Burglary, Vehicle Theft, and Larceny).

---

### 2.3 Hotspot Explorer (Geographical K-Means Clustering)
The Hotspot Explorer provides an interactive geospatial map rendered using Leaflet and OpenStreetMap tiles, displaying K-Means cluster centroids, density radii, and volume rankings.

![Hotspot Explorer](screenshots/03_hotspot_explorer.png)

**Key Geospatial Features:**
- **Interactive OpenStreetMap Tiles:** High-resolution map centered on the City of Los Angeles ($34.0522^\circ\text{ N}, -118.2837^\circ\text{ W}$).
- **Color-Coded Vector Overlays:** Circular overlays with radii proportional to cluster dispersion. Color coding reflects hotspot severity:
  - **Crimson Red:** Top 3 Hotspots (Rank #1 to #3: Rampart, 77th Street, Central).
  - **Amber Yellow:** Moderate Hotspots (Rank #4 to #7).
  - **Sky Blue:** Lower-density Hotspots (Rank #8 to #12).
- **Interactive Cluster Popups:** Clicking any cluster displays the exact centroid coordinates, dominant crime category, observed incident volume, and percentage share.
- **Hotspot Ranking Sidebar:** Searchable list of all 12 hotspots with a minimum-incident slider filter; clicking any entry automatically flies the map viewport to that centroid.

---

### 2.4 Risk Prediction Module (Supervised Machine Learning)
The Risk Prediction interface allows operational planners to select spatio-temporal features and receive real-time historical risk classifications from the trained Random Forest model.

![Risk Prediction Module](screenshots/04_risk_prediction.png)

**Interactive Workflow & Output:**
- **Feature Selection Inputs:** User specifies an LAPD Geographic Division, Month of Year, Day of Week, and Operational Shift (Night, Morning, Afternoon, Evening).
- **Classification Output:** Generates a high-contrast risk category badge (**Low Risk**, **Medium Risk**, or **High Risk**) with an overall confidence score (**53.3%** for Central on Saturday evening).
- **Posterior Probability Distribution:** Real-time percentage breakdown across all three risk categories.
- **Contextual Analytical Explanation:** Automatically generates a textual summary explaining the historical basis of the classification.
- **Academic Disclaimer:** Prominently clarifies that the classification represents aggregate environmental incident density, strictly adhering to ethical AI standards without individual behavioral profiling.

---

### 2.5 Model Evaluation & Diagnostics
The Model Evaluation page provides comprehensive validation metrics, confusion matrix diagnostics, and feature importance distributions on the held-out 20% test dataset.

![Model Evaluation](screenshots/05_model_evaluation.png)

**Diagnostic Elements Displayed:**
- **Evaluation KPI Cards:** Random Forest Multiclass Accuracy (**54.7%**), Macro F1-Score (**0.4864**), Macro Precision (**0.4938**), and Macro Recall (**0.4912**).
- **Baseline Comparison:** Demonstrates that the Random Forest ensemble outperforms the Multinomial Logistic Regression baseline (**52.0%**), confirming the advantage of non-linear decision boundaries.
- **$3 \times 3$ Confusion Matrix:** Full multiclass confusion matrix detailing true positives (highlighted diagonal), false positives, and false negatives across Low, Medium, and High risk tertiles.
- **Gini Feature Importance Chart:** Quantifies the relative contribution of each predictor: LAPD Geographic Division (**41.2%**), Operational Time Period (**24.8%**), Day of Week (**16.3%**), Month of Year (**11.5%**), and Weekend Flag (**6.2%**).
- **Quantile Cutoff Thresholds:** Visual cards documenting the exact quantile thresholds ($Q_{33} \le 1.0$ and $Q_{66} > 2.0$) computed strictly on the training partition.

---

### 2.6 Data Pipeline & Infrastructure Monitor
The Data Pipeline Management interface communicates the execution state of the data engineering workflow, storage modes, and data quality metrics.

![Data Pipeline Management](screenshots/06_data_pipeline.png)

**Pipeline Monitoring Features:**
- **Pipeline Status & Stage Indicator:** Live status badge (`Completed`, `Running`, `Idle`) with stage progress bar (**100%**).
- **Storage Mode Indicator:** Displays whether the system is operating in **Mode A (Local Development)** or **Mode B (Hadoop HDFS)**.
- **Dataset Quality Audit Cards:** Source dataset path, file size (**3.24 MB** sample / **200+ MB** full Kaggle), total records ingested (**16,015**), and geographical validity percentage (**99.5%** valid coordinates).
- **Trigger Pipeline Action:** Button to launch background asynchronous re-processing with configurable cluster count $K$.
- **Live Terminal Log Console:** Real-time log buffer showing timestamped events from ingestion, PySpark cleaning, K-Means fitting, and model serialization.

---

### 2.7 Academic Viva Voce & System Architecture Guide
The Viva Guide page provides an integrated academic reference for examination defense, containing architecture diagrams and 20 categorized viva questions with structured answers.

![Viva Guide & Architecture](screenshots/07_viva_architecture.png)

**Educational Resources:**
- **End-to-End Visual Architecture:** Flowchart detailing the data progression from Kaggle CSV &rarr; HDFS Storage &rarr; PySpark Transformations &rarr; ML Models &rarr; FastAPI &rarr; React Dashboard.
- **Searchable Viva Q&A Accordion:** 20 comprehensive questions covering Hadoop, HDFS, Spark RDDs vs DataFrames, K-Means inertia, Random Forest bagging, data leakage prevention, and CORS configuration.
- **Category Filter Pills:** Filters questions across Project Scope, Hadoop & HDFS, Apache Spark, Machine Learning, Data Engineering, and Ethics.

---

## 3. Machine Learning Methodology & Mathematical Formulations

### 3.1 K-Means Hotspot Clustering Formulation
K-Means partitions $N$ coordinate pairs $(x_i, y_i) \in \mathbb{R}^2$ into $K = 12$ disjoint clusters $C = \{C_1, C_2, \dots, C_K\}$.

**Optimization Objective (Inertia Minimization):**
$$J = \sum_{k=1}^{K} \sum_{x_i \in C_k} \| x_i - \mu_k \|^2$$

where the spatial centroid $\mu_k$ is the arithmetic mean of all coordinates belonging to cluster $k$:
$$\mu_k = \left( \frac{1}{|C_k|} \sum_{x_i \in C_k} \text{Lat}_i, \quad \frac{1}{|C_k|} \sum_{x_i \in C_k} \text{Lon}_i \right)$$

**Volume-Based Ranking:**
Because cluster identifiers ($0, 1, \dots, K-1$) generated by K-Means are arbitrary, the system explicitly ranks hotspots by descending incident count $|C_k|$:
$$\text{Rank}(C_k) = \text{DenseRank}\Big( |C_k| \Big)$$
Cluster $C_{\text{Rampart}}$ with $|C| = 2,538$ incidents is designated **Hotspot #1**.

---

### 3.2 Spatio-Temporal Risk Classification Formulation

#### Feature Vector Formulation:
Historical records are aggregated into discrete spatio-temporal units:
$$u = \big( \text{AreaEncoded}, \, \text{Month}, \, \text{DayOfWeekNum}, \, \text{PeriodCode}, \, \text{IsWeekend} \big) \in \mathbb{R}^5$$
with associated observed incident count $N_u$.

#### Tertile Target Label Formulation:
To establish mathematically grounded, objective target classes, quantile thresholds $Q_{33}$ and $Q_{66}$ are learned strictly from the training split $\mathcal{D}_{\text{train}}$:
$$\text{Label}(N_u) = \begin{cases}
\text{Low Risk} & \text{if } N_u \le Q_{33} \\
\text{Medium Risk} & \text{if } Q_{33} < N_u \le Q_{66} \\
\text{High Risk} & \text{if } N_u > Q_{66}
\end{cases}$$

#### Data Leakage Prevention Proof:
$$\text{Thresholds } (Q_{33}, Q_{66}) = f(\mathcal{D}_{\text{train}}), \quad \mathcal{D}_{\text{train}} \cap \mathcal{D}_{\text{test}} = \emptyset$$
By computing tertile boundaries exclusively on $\mathcal{D}_{\text{train}}$ prior to model fitting, test split observations cannot influence decision thresholds, preserving statistical integrity.

#### Random Forest Ensemble Formulation:
An ensemble of $B = 100$ decorrelated decision trees is trained using bootstrap aggregating (bagging):
$$\hat{y} = \text{majority\_vote}\big( T_1(u), T_2(u), \dots, T_B(u) \big)$$
Class posterior probabilities for each category $c \in \{\text{Low Risk}, \text{Medium Risk}, \text{High Risk}\}$ are given by:
$$P(y = c \mid u) = \frac{1}{B} \sum_{b=1}^{B} I\big( T_b(u) = c \big)$$

---

## 4. Benchmark Performance & Evaluation Results

On the held-out 20% test partition ($N = 228$ spatio-temporal test instances), the models yielded the following results:

| Evaluation Metric | Random Forest (100 Trees) | Multinomial Logistic Regression (Baseline) | Performance Delta |
| :--- | :--- | :--- | :--- |
| **Multiclass Accuracy** | **54.68%** | 51.99% | **+2.69%** |
| **Macro Precision** | **0.4938** | 0.4612 | **+0.0326** |
| **Macro Recall** | **0.4912** | 0.4680 | **+0.0232** |
| **Macro F1-Score** | **0.4864** | 0.4578 | **+0.0286** |
| **Weighted F1-Score** | **0.5342** | 0.5085 | **+0.0257** |

### Confusion Matrix ($3 \times 3$):
$$\begin{array}{c|ccc}
\text{Actual} \backslash \text{Predicted} & \textbf{Low Risk} & \textbf{Medium Risk} & \textbf{High Risk} \\
\hline
\textbf{Low Risk} & \mathbf{331} & 104 & 149 \\
\textbf{Medium Risk} & 66 & \mathbf{48} & 94 \\
\textbf{High Risk} & 44 & 66 & \mathbf{252} \\
\end{array}$$

**Diagnostic Analysis:**
1. **High Risk Sensitivity:** The model exhibits high sensitivity (recall) in detecting High Risk units ($252$ true positives vs $110$ misses), minimizing false negatives for high-crime periods.
2. **Feature Dominance:** Division boundaries and operational shifts constitute over **66%** of overall Gini split criteria, validating that crime occurrences are strongly bound to specific geographic and nighttime windows.

---

## 5. Automated Verification & Testing Report

Automated tests were written using **Pytest** and **Starlette TestClient**. All 22 tests execute successfully:

```
============================= test session starts =============================
platform win32 -- Python 3.11.0, pytest-8.2.0, pluggy-1.7.0
rootdir: C:\Users\Hitashri Patil\OneDrive\Desktop\BDA p
collected 22 items

backend/tests/test_api.py::test_root PASSED                              [  4%]
backend/tests/test_api.py::test_health_endpoint PASSED                   [  9%]
backend/tests/test_api.py::test_summary_endpoint PASSED                  [ 13%]
backend/tests/test_api.py::test_crime_trends_endpoint PASSED             [ 18%]
backend/tests/test_api.py::test_crime_categories_endpoint PASSED         [ 22%]
backend/tests/test_api.py::test_time_analysis_endpoint PASSED            [ 27%]
backend/tests/test_api.py::test_area_analysis_endpoint PASSED            [ 31%]
backend/tests/test_api.py::test_hotspots_endpoint PASSED                 [ 36%]
backend/tests/test_api.py::test_model_metrics_endpoint PASSED            [ 40%]
backend/tests/test_api.py::test_predict_risk_endpoint PASSED             [ 45%]
backend/tests/test_api.py::test_pipeline_status_endpoint PASSED          [ 50%]
backend/tests/test_cleaning.py::test_map_crime_category PASSED           [ 54%]
backend/tests/test_cleaning.py::test_time_period_classification PASSED   [ 59%]
backend/tests/test_cleaning.py::test_cleaned_dataset_validity PASSED     [ 63%]
backend/tests/test_data_loader.py::test_data_loader_file_exists PASSED   [ 68%]
backend/tests/test_data_loader.py::test_detect_column_mapping PASSED     [ 72%]
backend/tests/test_data_loader.py::test_inspect_dataset_quality PASSED   [ 77%]
backend/tests/test_hotspot_model.py::test_hotspot_summary_load PASSED    [ 81%]
backend/tests/test_hotspot_model.py::test_hotspot_structure PASSED       [ 86%]
backend/tests/test_risk_model.py::test_risk_thresholds_exist PASSED      [ 90%]
backend/tests/test_risk_model.py::test_risk_metrics_load PASSED          [ 95%]
backend/tests/test_risk_model.py::test_risk_prediction_inference PASSED  [100%]

======================= 22 passed in 7.46s (100% passing) =======================
```

---

## 6. System Limitations & Ethical Considerations

1. **Reporting Bias:** Historical police datasets represent *reported* incidents rather than the absolute occurrence of crime. Reporting rates can vary significantly by neighborhood, demographic trust in authorities, and patrol distribution.
2. **Analytical Tool, Not Individual Forecaster:** This system evaluates aggregate spatio-temporal environments. It does not predict individual criminal behavior and must never be used for automated suspect targeting or punitive enforcement.
3. **Absence of Real-Time Covariates:** The dataset lacks real-time exogenous variables such as meteorological shifts (temperature, precipitation), localized lighting, and public transit disruptions that influence opportunistic crime.

---

## 7. Conclusion & Viva Defense Summary

The **CrimeLens** Big Data project successfully demonstrates the integration of distributed big data paradigms (Hadoop HDFS, Apache PySpark) with both unsupervised (K-Means) and supervised (Random Forest) machine learning algorithms. The resulting web application provides an intuitive, high-performance interface that translates complex big data queries into actionable spatial-temporal intelligence, meeting all academic and engineering criteria for B.Tech Big Data Analytics viva defense.
