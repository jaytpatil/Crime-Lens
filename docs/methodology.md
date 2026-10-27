# Technical Methodology & Analytical Formulations

## 1. Data Preprocessing & Validation

### 1.1 Ingestion & Canonical Schema Mapping
The source dataset is the Kaggle Los Angeles Police Department dataset titled **“Crime Data from 2020 to Present”**. The ingestion engine inspects column headers dynamically and maps them to canonical internal identifiers:

$$\text{Canonical Mapping}: \quad \begin{cases}
\text{DR\_NO} \to \text{dr\_no} \\
\text{DATE OCC} \to \text{date\_occurred} \\
\text{TIME OCC} \to \text{time\_occurred} \\
\text{AREA NAME} \to \text{area\_name} \\
\text{Crm Cd Desc} \to \text{crime\_desc} \\
\text{LAT, LON} \to \text{latitude, longitude}
\end{cases}$$

### 1.2 Coordinate Bounding Box Filtering
Raw LAPD datasets frequently contain $(0.0, 0.0)$ coordinates for crimes occurring off-grid or where location is unverified. These placeholder points severely distort K-Means centroid calculations. The system applies strict bounding constraints:

$$33.65^\circ \le \text{Latitude} \le 34.40^\circ \quad \text{and} \quad -118.75^\circ \le \text{Longitude} \le -118.10^\circ$$

Records outside these bounds are discarded from spatial modeling and logged.

### 1.3 Temporal Feature Extraction
Military time values ($\text{TIME OCC} \in [0001, 2359]$) are converted into discrete hours and 4 operational shifts:

$$\text{Hour} = \left\lfloor \frac{\text{TIME OCC}}{100} \right\rfloor \in [0, 23]$$

$$\text{Operational Period} = \begin{cases}
\text{Night} & \text{if } 0 \le \text{Hour} \le 5 \\
\text{Morning} & \text{if } 6 \le \text{Hour} \le 11 \\
\text{Afternoon} & \text{if } 12 \le \text{Hour} \le 17 \\
\text{Evening} & \text{if } 18 \le \text{Hour} \le 23
\end{cases}$$

---

## 2. K-Means Hotspot Clustering Formulation

K-Means is an unsupervised spatial clustering algorithm applied to standardized coordinates $(x_i, y_i)$.

### 2.1 Optimization Objective
The algorithm minimizes the Within-Cluster Sum of Squares (WCSS), also known as **Inertia**:

$$J = \sum_{k=1}^{K} \sum_{x_i \in C_k} \| x_i - \mu_k \|^2$$

where:
- $K = 12$ is the number of configured clusters.
- $C_k$ is the set of incident points assigned to cluster $k$.
- $\mu_k = \left( \frac{1}{|C_k|} \sum_{x_i \in C_k} \text{Lat}_i, \, \frac{1}{|C_k|} \sum_{x_i \in C_k} \text{Lon}_i \right)$ is the geographic centroid of cluster $k$.

### 2.2 Volume-Based Hotspot Ranking
Cluster indices ($0, 1, \dots, K-1$) produced by K-Means are arbitrary. To interpret them as hotspots, clusters are sorted in descending order of observed incident volume:

$$\text{Rank}(C_k) = \text{DenseRank}\Big( |C_k| \Big)$$

The cluster with the highest incident volume is designated **Hotspot #1**.

---

## 3. Crime Risk Classification Methodology

### 3.1 Spatio-Temporal Aggregation
Incident records are grouped into spatio-temporal cells:

$$\text{Unit} = \big( \text{Area Name}, \, \text{Month}, \, \text{Day of Week}, \, \text{Period Code}, \, \text{Is Weekend} \big)$$

For each cell, the historical incident frequency $N$ is counted.

### 3.2 Target Label Generation via Quantiles
To prevent subjective or arbitrary cutoffs, labels are formulated via **tertile distribution** learned strictly from the 80% training partition:

$$\text{Risk Label}(N) = \begin{cases}
\text{Low Risk} & \text{if } N \le Q_{33} \\
\text{Medium Risk} & \text{if } Q_{33} < N \le Q_{66} \\
\text{High Risk} & \text{if } N > Q_{66}
\end{cases}$$

where $Q_{33}$ and $Q_{66}$ are the 33.33rd and 66.67th percentiles of incident counts in the training set.

> **Data Leakage Safeguard:** Thresholds $Q_{33}$ and $Q_{66}$ are computed **only** on the training partition and frozen before being applied to the test set and saved for inference.

### 3.3 Random Forest Classifier
The Random Forest model constructs $B = 100$ decorrelated decision trees using bootstrap aggregation (bagging). At each node split, a random subset of $m = \sqrt{p}$ features is evaluated:

$$\hat{y} = \text{mode}\big( T_1(x), T_2(x), \dots, T_B(x) \big)$$

Posterior probabilities for class $c \in \{\text{Low}, \text{Medium}, \text{High}\}$ are computed by averaging tree predictions:

$$P(y = c \mid x) = \frac{1}{B} \sum_{b=1}^{B} I\big( T_b(x) = c \big)$$

### 3.4 Evaluation Metrics
For multiclass evaluation across classes $C = \{\text{Low}, \text{Med}, \text{High}\}$:

$$\text{Accuracy} = \frac{\sum_{c} \text{TP}_c}{\text{Total Test Instances}}$$

$$\text{Macro Precision} = \frac{1}{|C|} \sum_{c \in C} \frac{\text{TP}_c}{\text{TP}_c + \text{FP}_c}$$

$$\text{Macro Recall} = \frac{1}{|C|} \sum_{c \in C} \frac{\text{TP}_c}{\text{TP}_c + \text{FN}_c}$$

$$\text{Macro F1} = 2 \cdot \frac{\text{Precision}_{\text{macro}} \cdot \text{Recall}_{\text{macro}}}{\text{Precision}_{\text{macro}} + \text{Recall}_{\text{macro}}}$$
