# Academic Viva Voce Questions & Answers

**Course:** B.Tech Computer Engineering — Big Data Analytics (BDA)  
**Project:** Big Data Analytics for Crime Pattern Analysis and Crime Risk Prediction using Hadoop and Machine Learning

---

### Q1: What is the primary objective of this project?
**Answer:** The project ingests large historical crime records (Kaggle LAPD dataset 2020–Present), processes them using distributed Big Data storage (Hadoop HDFS) and in-memory distributed processing (Apache Spark), discovers geographic crime hotspots using K-Means clustering, and classifies aggregate area/time units into Low, Medium, and High historical crime risk using a Random Forest Classifier.

---

### Q2: What is Hadoop and why is HDFS used here?
**Answer:** Apache Hadoop is an open-source framework for distributed storage and processing of large datasets across clusters of commodity hardware. HDFS (Hadoop Distributed File System) stores massive files by breaking them into 128 MB blocks and replicating them across DataNodes. It provides fault tolerance, high throughput, and decouples storage from compute.

---

### Q3: What is the directory structure configured in HDFS for this project?
**Answer:** 
- `/crime-analysis/raw/`: Ingested raw CSV files.
- `/crime-analysis/processed/`: Cleaned and transformed Parquet/CSV files.
- `/crime-analysis/analytics/`: Pre-aggregated JSON summaries for rapid API queries.
- `/crime-analysis/models/`: Serialized K-Means and Random Forest models.

---

### Q4: Why is Apache Spark preferred over Hadoop MapReduce for data processing?
**Answer:** Traditional MapReduce writes intermediate output to local disks after each map or reduce cycle, creating massive I/O bottlenecks. Apache Spark performs in-memory computations using Resilient Distributed Datasets (RDDs) and Catalyst-optimized DataFrames, running multi-pass transformations and aggregations up to 100 times faster.

---

### Q5: What is the difference between Mode A and Mode B in this system?
**Answer:**
- **Mode A (Local Development Mode):** Runs locally using local filesystem storage and PySpark's `local[*]` master or vectorised Python operations.
- **Mode B (Hadoop HDFS Integration Mode):** Integrates with a running Hadoop NameNode and DataNode via WebHDFS REST API or RPC, reading and writing files directly to HDFS. The application transparently reports the active mode in the UI.

---

### Q6: What data cleaning steps were performed in PySpark?
**Answer:**
1. Deduplication using `dropDuplicates(["DR_NO"])`.
2. Removal of placeholder coordinates `(0.0, 0.0)` and filtering points outside Los Angeles County bounds ($33.65^\circ \le \text{Lat} \le 34.40^\circ, -118.75^\circ \le \text{Lon} \le -118.10^\circ$).
3. Parsing military time integer (`TIME OCC`) into hours (0–23) and 4 operational shifts (Night, Morning, Afternoon, Evening).
4. Mapping granular offense codes into broad normalized legal categories.

---

### Q7: Why is Parquet format preferred over CSV for processed big data?
**Answer:** Apache Parquet is a columnar binary storage format that provides efficient compression (Snappy) and column projection. When a query requests only specific columns (e.g., `latitude`, `longitude`), Parquet reads only those column chunks from disk, skipping irrelevant data and reducing I/O by up to 80%.

---

### Q8: How does the K-Means clustering algorithm discover crime hotspots?
**Answer:** K-Means is an unsupervised clustering algorithm. It takes standardized latitude and longitude coordinates and iteratively partitions them into $K=12$ clusters by minimizing the within-cluster sum of squares (inertia):
$$J = \sum_{k=1}^{K} \sum_{x_i \in C_k} \| x_i - \mu_k \|^2$$
The resulting cluster centroids $\mu_k$ represent the geographic centers of observed crime concentrations.

---

### Q9: Are K-Means cluster numbers (0 to 11) equivalent to risk rankings?
**Answer:** No. Cluster indices assigned by K-Means are arbitrary identifiers. In our system, hotspots are explicitly ranked #1 to #12 based on observed incident volume (total incident count in each cluster), where Rank #1 represents the highest observed concentration.

---

### Q10: How are the Low, Medium, and High crime risk target labels formulated?
**Answer:** Historical records are grouped into spatio-temporal cells: `(Area Name, Month, Day of Week, Time Period) -> Count N`. Tertile quantiles ($Q_{33}$ and $Q_{66}$) are computed strictly on the training partition:
- **Low Risk:** $N \le Q_{33}$
- **Medium Risk:** $Q_{33} < N \le Q_{66}$
- **High Risk:** $N > Q_{66}$
Thresholds are frozen and reused during evaluation and inference.

---

### Q11: What is data leakage and how was it prevented?
**Answer:** Data leakage occurs when test set information inadvertently contaminates the training process. It was prevented by:
1. Performing the 80/20 train/test split **before** calculating the risk thresholds.
2. Deriving $Q_{33}$ and $Q_{66}$ strictly on the training partition.
3. Using only historical aggregate features, avoiding future incident counts.

---

### Q12: Why were victim age, sex, and ethnicity excluded from the risk classifier?
**Answer:** In accordance with ethical AI and fairness principles, individual victim or demographic characteristics must not be used to predict crime risk. The system evaluates purely environmental and spatio-temporal dynamics (geographic division, month, day, time period).

---

### Q13: What machine learning model was chosen for risk classification and why?
**Answer:** A Random Forest Classifier with 100 decision trees. As an ensemble bagging model, Random Forest captures non-linear interactions between temporal features and geographic divisions, handles class imbalance via balanced weighting, and resists overfitting compared to individual decision trees.

---

### Q14: What baseline model was used for comparison?
**Answer:** Multinomial Logistic Regression. Logistic Regression achieved ~52.0% accuracy, whereas Random Forest achieved ~54.7% accuracy with higher macro F1, demonstrating the superiority of non-linear ensemble boundaries for crime pattern classification.

---

### Q15: What evaluation metrics are reported for the classification model?
**Answer:**
1. Multiclass Accuracy
2. Macro Precision and Macro Recall
3. Macro F1-score and Weighted F1-score
4. Full $3 \times 3$ Confusion Matrix (True Positives, False Positives, False Negatives across Low, Medium, and High Risk).

---

### Q16: How does FastAPI handle long-running pipeline execution without freezing?
**Answer:** FastAPI uses asynchronous `BackgroundTasks` along with Python `threading.Lock`. Triggering `POST /api/pipeline/run` immediately returns HTTP 200 with `status: "running"` while a worker thread runs PySpark and ML training in the background and updates the log buffer.

---

### Q17: How is the geographical map visualized in the React frontend?
**Answer:** The frontend integrates Leaflet.js with OpenStreetMap raster tiles. Hotspot centroids from `/api/hotspots` are rendered as circular vector overlays with radii scaled to spatial cluster density and colors indicating hotspot severity (Red for top 3, Amber for 4–7, Sky Blue for others).

---

### Q18: What are the main exploratory data analysis findings?
**Answer:**
1. Assault/Battery and Vehicle Thefts account for over 35% of all incidents.
2. Diurnal crime volume peaks between 18:00 and 23:00 (Evening).
3. Weekends exhibit higher street assault and vehicle theft densities, while weekdays show higher rates of commercial burglary and identity theft.
4. Central, Rampart, and 77th Street divisions exhibit the highest aggregate incident density.

---

### Q19: What are the primary limitations of this analytical tool?
**Answer:**
1. **Reporting Bias:** The dataset reflects reported crimes only, which depends on community trust and police reporting patterns.
2. **Analytical Tool, Not Individual Forecaster:** It estimates aggregate historical frequency, not individual behavioral actions.
3. **Missing Covariates:** External factors like real-time weather, lighting, or transit access are not present in the historical CSV.

---

### Q20: How can this system be scaled up for real-world municipal deployment?
**Answer:**
1. Connect PySpark to an Apache Kafka streaming pipeline for real-time CAD (Computer-Aided Dispatch) log ingestion.
2. Store streaming parquet files on AWS S3 or a multi-node Hadoop HDFS cluster.
3. Train geospatial graph neural networks (GNNs) or spatio-temporal LSTMs for fine-grained hourly forecasts.
